import * as actions from '../actions';
import {currentItem, currentItemType, planningProfile} from '../selectors/forms';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {ModalsContainer} from '../components';
import {planning} from '../actions';
import {get, isEmpty, isNumber} from 'lodash';
import {registerNotifications, getErrorMessage, isExistingItem} from '../utils';
import {WORKSPACE, MODALS} from '../constants';
import {GET_LABEL_MAP} from 'superdesk-core/scripts/apps/workspace/content/constants';
import {IArticle, IContentProfile} from 'superdesk-api';
import {planningApi, superdeskApi} from '../superdeskApi';
import {PLANNING_VIEW} from '../interfaces';

const DEFAULT_PLANNING_SCHEMA = {
    anpa_category: {required: true},
    subject: {required: true},
    slugline: {required: true},
    urgency: {required: true},
};

export class AddToPlanningController {
    $scope: any;
    notify: {error: (message: string) => void};
    gettext: (
        value: string,
        params?: {[placeholder: string]: string | number | React.ComponentType},
    ) => string;
    api: any;
    lock: any;
    session: any;
    userList: any;
    $timeout: any;
    superdeskFlags: any;
    $element: any;
    store: any;
    newsItem: any;
    item: any;
    rendered: boolean;

    constructor(
        $element,
        $scope,
        sdPlanningStore,
        notify,
        gettext,
        api,
        lock,
        session,
        userList,
        $timeout,
        superdeskFlags
    ) {
        this.$element = $element;
        this.$scope = $scope;
        this.notify = notify;
        this.gettext = gettext;
        this.api = api;
        this.lock = lock;
        this.session = session;
        this.userList = userList;
        this.$timeout = $timeout;
        this.superdeskFlags = superdeskFlags;

        this.render = this.render.bind(this);
        this.loadWorkspace = this.loadWorkspace.bind(this);
        this.onDestroy = this.onDestroy.bind(this);
        this.onItemUnlock = this.onItemUnlock.bind(this);

        this.store = null;
        this.newsItem = null;
        this.item = $scope.locals?.data?.item ?? {};
        this.rendered = false;

        if (this.item.archive_item) {
            this.item = this.item.archive_item;
        }

        $scope.$on('$destroy', this.onDestroy);
        $scope.$on('item:unlock', this.onItemUnlock);

        if (this.item.archive_item) {
            this.item = this.item.archive_item;
        }

        return sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING, this.loadWorkspace)
            .then(
                this.render,
                this.$scope.resolve
            );
    }

    render() {
        this.store.dispatch(actions.main.closeEditor());
        this.store.dispatch(actions.main.closePreview());

        this.store.dispatch(actions.showModal({
            modalType: MODALS.ADD_TO_PLANNING,
            modalProps: {
                newsItem: this.newsItem,
                fullscreen: true,
                $scope: this.$scope,
            },
        }));

        ReactDOM.render(
            <Provider store={this.store}>
                <ModalsContainer />
            </Provider>,
            this.$element.get(0)
        );

        this.rendered = true;
        return Promise.resolve();
    }

    loadWorkspace(store, workspaceChanged) {
        this.store = store;

        return this.loadArchiveItem()
            .then((newsItem) => {
                this.newsItem = newsItem;

                this.store.dispatch(planning.ui.requestPlannings({
                    excludeRescheduledAndCancelled: true,
                }));
                this.store.dispatch(actions.main.closePublishQueuePreviewOnWorkspaceChange());

                registerNotifications(this.$scope, this.store);

                return Promise.all([
                    this.store.dispatch(actions.main.filter(PLANNING_VIEW.PLANNING)),
                    planningApi.locks.loadLockedItems(),
                    this.store.dispatch(actions.fetchAgendas()),
                ]);
            });
    }

    onDestroy() {
        if (this.store) {
            this.store.dispatch(planning.ui.requestPlannings({
                excludeRescheduledAndCancelled: false,
            }));

            const planningEdited = currentItem(this.store.getState());

            if (isExistingItem(planningEdited)) {
                this.store.dispatch(actions.main.unlockAndCancel(planningEdited))
                    .then(() => {
                        this.store.dispatch(actions.hideModal());
                        this.$timeout(() => {
                            this.store.dispatch(actions.resetStore());
                        }, 1000);
                    });
            } else if (currentItemType(this.store.getState())) {
                // If we were creating a new planning item and editor is open
                this.store.dispatch(actions.main.closeEditor());
            }

            // update the scope item.
            if (this.item && this.newsItem.assignment_id) {
                this.item.assignment_id = this.newsItem.assignment_id;
            }

            this.store.dispatch(actions.hideModal());
            this.$timeout(() => {
                this.store.dispatch(actions.resetStore());
            }, 1000);
        }

        // Only unlock the item if it was locked when launching this modal
        if ((this.newsItem?.lock_session ?? null) !== null
            && (this.newsItem.lock_action ?? 'edit') === 'add_to_planning'
        ) {
            this.lock.unlock(this.newsItem);
        }

        if (this.rendered) {
            ReactDOM.unmountComponentAtNode(this.$element.get(0));
        }
    }

    onItemUnlock(_e, data) {
        if (this.store &&
            data.item === this.newsItem._id &&
            data.lock_session !== this.session.sessionId
        ) {
            this.store.dispatch(actions.hideModal());
            this.store.dispatch(actions.resetStore());

            if (this.superdeskFlags.flags.authoring || !this.rendered) {
                this.$scope.resolve();
                return;
            }

            this.userList.getUser(data.user).then(
                (user) => Promise.resolve(user.display_name),
                () => Promise.resolve('unknown')
            )
                .then((username) => this.store.dispatch(actions.showModal({
                    modalType: MODALS.NOTIFICATION_MODAL,
                    modalProps: {
                        title: this.gettext('Item Unlocked'),
                        body: this.gettext('The item was unlocked by "{{ username }}"', {username}),
                        action: () => {
                            this.newsItem.lock_session = null;
                            this.$scope.resolve();
                        },
                    },
                })));
        }
    }

    getArchiveItemAndProfile(): Promise<{
        newsItem: IArticle,
        contentProfile: IContentProfile
    }> {
        return this.api.find('archive', this.item._id)
            .then((newsItem: IArticle) => {
                const contentProfile = superdeskApi.entities.contentProfile.get(newsItem.profile);

                return Promise.resolve({
                    newsItem,
                    contentProfile
                });
            }, (error) => {
                this.notify.error(
                    getErrorMessage(error, this.gettext('Failed to load the item.'))
                );
                this.$scope.resolve(error);
                return Promise.reject(error);
            });
    }

    loadArchiveItem() {
        return this.getArchiveItemAndProfile()
            .then(({newsItem, contentProfile}) => {
                const errMessages = [];
                const profile = planningProfile(this.store.getState());
                const planningSchema = profile.schema || DEFAULT_PLANNING_SCHEMA;
                const requiredError = (field) => this.gettext('[{{ field }}] is a required field')
                    .replace('{{ field }}', field);
                const labels = GET_LABEL_MAP();

                if (newsItem?.assignment_id) {
                    errMessages.push(this.gettext('Item already linked to a Planning item'));
                }

                Object.keys(planningSchema)
                    .filter((field) => (
                        contentProfile.schema[field] != null &&
                        planningSchema[field]?.required === true &&
                        isEmpty(newsItem[field]) &&
                        !isNumber(newsItem[field])
                    ))
                    .forEach((field) => {
                        errMessages.push(requiredError(labels[field] || field));
                    });

                if (errMessages.length) {
                    errMessages.forEach((err) => {
                        this.notify.error(err);
                    });

                    this.$scope.resolve('foo');
                    return Promise.reject('foo');
                }

                if (this.lock.isLocked(newsItem)) {
                    this.notify.error(
                        this.gettext('Item already locked.')
                    );
                    this.$scope.resolve('bar');
                    return Promise.reject('bar');
                }

                if (!this.lock.isLockedInCurrentSession(newsItem)) {
                    newsItem._editable = true;
                    return this.lock.lock(newsItem, false, 'add_to_planning')
                        .then(
                            (lockedItem) => Promise.resolve(lockedItem),
                            (error) => {
                                this.notify.error(
                                    getErrorMessage(error, this.gettext('Failed to lock the item.'))
                                );
                                this.$scope.resolve(error);
                                return Promise.reject(error);
                            }
                        );
                }

                return Promise.resolve(newsItem);
            });
    }
}

AddToPlanningController.$inject = [
    '$element',
    '$scope',
    'sdPlanningStore',
    'notify',
    'gettext',
    'api',
    'lock',
    'session',
    'userList',
    '$timeout',
    'superdeskFlags',
];
