import * as actions from '../actions';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {ModalsContainer} from '../components';
import {get} from 'lodash';
import {registerNotifications} from '../utils';
import {WORKSPACE, MODALS, ASSIGNMENTS} from '../constants';
import {getErrorMessage} from '../utils/index';

export class FulFilAssignmentController {
    constructor(
        $element,
        $scope,
        sdPlanningStore,
        notify,
        gettext,
        lock,
        session,
        userList,
        api,
        $timeout,
        superdeskFlags,
        desks
    ) {
        this.$element = $element;
        this.$scope = $scope;
        this.notify = notify;
        this.gettext = gettext;
        this.lock = lock;
        this.session = session;
        this.userList = userList;
        this.api = api;
        this.$timeout = $timeout;
        this.superdeskFlags = superdeskFlags;
        this.desks = desks;

        this.render = this.render.bind(this);
        this.loadWorkspace = this.loadWorkspace.bind(this);
        this.onDestroy = this.onDestroy.bind(this);
        this.onItemUnlock = this.onItemUnlock.bind(this);
        this.loadArchiveItem = this.loadArchiveItem.bind(this);

        this.store = null;
        this.newsItem = null;
        this.item = get($scope, 'locals.data.item', {});
        this.rendered = false;

        $scope.$on('$destroy', this.onDestroy);
        $scope.$on('item:unlock', this.onItemUnlock);

        if (get(this.item, 'archive_item')) { // use archive item for published
            this.item = this.item.archive_item;
        }

        if (get(this.item, 'slugline', '') === '') {
            this.notify.error(
                this.gettext('[SLUGLINE] is a required field')
            );
            this.$scope.resolve();
            return;
        }

        return sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING, this.loadWorkspace)
            .then(
                this.render,
                this.$scope.resolve
            );
    }

    render() {
        this.store.dispatch(actions.main.closePublishQueuePreviewOnWorkspaceChange());

        ReactDOM.render(
            <Provider store={this.store}>
                <ModalsContainer />
            </Provider>,
            this.$element.get(0)
        );

        this.store.dispatch(actions.showModal({
            modalType: MODALS.FULFIL_ASSIGNMENT,
            modalProps: {
                newsItem: this.newsItem,
                fullscreen: true,
                $scope: this.$scope, // Required by actions dispatches
                onCancel: this.$scope.resolve,
            },
        }));

        this.rendered = true;
        return Promise.resolve();
    }

    loadWorkspace(store, workspaceChanged) {
        this.store = store;

        return this.loadArchiveItem()
            .then((newsItem) => {
                this.newsItem = newsItem;
                registerNotifications(this.$scope, this.store);

                return store.dispatch(
                    actions.assignments.ui.loadFulfillModal(
                        this.newsItem,
                        [
                            ASSIGNMENTS.LIST_GROUPS.CURRENT.id,
                            ASSIGNMENTS.LIST_GROUPS.FUTURE.id,
                        ]
                    )
                );
            });
    }

    onDestroy() {
        if (this.store) {
            this.store.dispatch(actions.hideModal());
            this.$timeout(() => {
                this.store.dispatch(actions.resetStore());
            }, 1000);

            // Only unlock the item if it was locked when launching this modal
            if (get(this.newsItem, 'lock_session', null) !== null &&
                get(this.newsItem, 'lock_action', 'edit') === 'fulfil_assignment' &&
                this.lock.isLockedInCurrentSession(this.newsItem)
            ) {
                this.lock.unlock(this.newsItem);
            }

            // update the scope item.
            if (this.item && get(this.newsItem, 'assignment_id')) {
                this.item.assignment_id = this.newsItem.assignment_id;
            }
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
                    modalType: 'NOTIFICATION_MODAL',
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

    loadArchiveItem() {
        return this.api.find('archive', this.item._id)
            .then((newsItem) => {
                if (get(newsItem, 'assignment_id')) {
                    this.notify.error(
                        this.gettext('Item already linked to a Planning item')
                    );
                    this.$scope.resolve();
                    return Promise.reject();
                }

                if (this.lock.isLocked(newsItem)) {
                    this.notify.error(
                        this.gettext('Item already locked.')
                    );
                    this.$scope.resolve();
                    return Promise.reject();
                }

                if (!this.lock.isLockedInCurrentSession(newsItem)) {
                    newsItem._editable = true;
                    return this.lock.lock(newsItem, false, 'fulfil_assignment')
                        .then(
                            (lockedItem) => Promise.resolve(lockedItem),
                            (error) => {
                                this.notify.error(
                                    this.gettext(
                                        getErrorMessage(error, 'Failed to lock the item.')
                                    )
                                );
                                this.$scope.resolve(error);
                                return Promise.reject(error);
                            }
                        );
                }

                return Promise.resolve(newsItem);
            }, (error) => {
                this.notify.error(
                    this.gettext(
                        getErrorMessage(error, 'Failed to load the item.')
                    )
                );
                this.$scope.resolve(error);
                return Promise.reject(error);
            });
    }
}

FulFilAssignmentController.$inject = [
    '$element',
    '$scope',
    'sdPlanningStore',
    'notify',
    'gettext',
    'lock',
    'session',
    'userList',
    'api',
    '$timeout',
    'superdeskFlags',
    'desks',
];
