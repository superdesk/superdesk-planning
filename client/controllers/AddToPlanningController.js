import * as actions from '../actions';
import {currentItem} from '../selectors/forms';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {ModalsContainer} from '../components';
import {locks} from '../actions';
import {get} from 'lodash';
import {registerNotifications, getErrorMessage} from '../utils';
import {WORKSPACE, MODALS, MAIN} from '../constants';

AddToPlanningController.$inject = [
    '$element',
    '$scope',
    '$location',
    'sdPlanningStore',
    '$q',
    'notify',
    'gettext',
    'api',
    'lock',
    'session',
    'userList',
    '$timeout',
    'superdeskFlags',
];

export function AddToPlanningController(
    $element,
    $scope,
    $location,
    sdPlanningStore,
    $q,
    notify,
    gettext,
    api,
    lock,
    session,
    userList,
    $timeout,
    superdeskFlags
) {
    const item = get($scope, 'locals.data.item');

    return api.find('archive', item._id)
        .then((newsItem) => {
            let failed = false;
            let errMessages = [];

            if (get(newsItem, 'assignment_id')) {
                errMessages.push('Item already linked to a Planning item');
                failed = true;
            }

            if (get(newsItem, 'slugline', '') === '') {
                errMessages.push('[SLUGLINE] is a required field');
                failed = true;
            }

            if (get(newsItem, 'urgency', null) === null) {
                errMessages.push('[URGENCY] is a required field');
                failed = true;
            }

            if (get(newsItem, 'subject.length', 0) === 0) {
                errMessages.push('[SUBJECT] is a required field');
                failed = true;
            }

            if (get(newsItem, 'anpa_category.length', 0) === 0) {
                errMessages.push('[CATEGORY] is a required field');
                failed = true;
            }

            if (failed) {
                errMessages.forEach((err) => {
                    notify.error(err);
                });

                $scope.reject();
                return Promise.reject();
            }

            if (lock.isLocked(newsItem)) {
                notify.error(
                    gettext('Item already locked.')
                );
                $scope.reject();
                return Promise.reject();
            }

            if (!lock.isLockedInCurrentSession(newsItem)) {
                newsItem._editable = true;
                return lock.lock(newsItem, false, 'add_to_planning')
                    .then(
                        (lockedItem) => Promise.resolve(lockedItem),
                        (error) => {
                            notify.error(
                                getErrorMessage(error, 'Failed to lock the item.')
                            );
                            $scope.reject(error);
                            return Promise.reject(error);
                        }
                    );
            }

            return Promise.resolve(newsItem);
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to load the item.')
            );
            $scope.reject(error);
            return Promise.reject(error);
        })
        .then((newsItem) => (
            sdPlanningStore.getStore()
                .then((store) => {
                    store.dispatch(actions.initStore(WORKSPACE.AUTHORING));
                    registerNotifications($scope, store);

                    $q.all({
                        data: store.dispatch(actions.main.filter(MAIN.FILTERS.PLANNING)),
                        locks: store.dispatch(locks.loadAllLocks()),
                        agendas: store.dispatch(actions.fetchAgendas()),
                    })
                        .then(() => {
                            store.dispatch(actions.main.closeEditor());
                            ReactDOM.render(
                                <Provider store={store}>
                                    <ModalsContainer/>
                                </Provider>,
                                $element.get(0)
                            );

                            store.dispatch(actions.showModal({
                                modalType: MODALS.ADD_TO_PLANNING,
                                modalProps: {
                                    newsItem: newsItem,
                                    fullscreen: true,
                                    $scope: $scope,
                                },
                            }));

                            $scope.$on('$destroy', () => {
                                const planningEdited = currentItem(store.getState());

                                if (get(planningEdited, '_id')) {
                                    store.dispatch(actions.main.unlockAndCancel(planningEdited))
                                        .then(() => {
                                            store.dispatch(actions.hideModal());
                                            $timeout(() => {
                                                store.dispatch(actions.resetStore());
                                            }, 1000);
                                        });
                                }


                                // Only unlock the item if it was locked when launching this modal
                                if (get(newsItem, 'lock_session', null) !== null &&
                                    get(newsItem, 'lock_action', 'edit') === 'add_to_planning') {
                                    lock.unlock(newsItem);
                                }

                                // update the scope item.
                                item.assignment_id = newsItem.assignment_id;
                                store.dispatch(actions.hideModal());
                                ReactDOM.unmountComponentAtNode($element.get(0));
                            });

                            $scope.$on('item:unlock', (_e, data) => {
                                if (data.item === newsItem._id && data.lock_session !== session.sessionId) {
                                    store.dispatch(actions.hideModal());
                                    store.dispatch(actions.resetStore());

                                    if (superdeskFlags.flags.authoring) {
                                        $scope.reject();
                                        return;
                                    }

                                    userList.getUser(data.user).then(
                                        (user) => Promise.resolve(user.display_name),
                                        () => Promise.resolve('unknown')
                                    )
                                        .then((username) => store.dispatch(actions.showModal({
                                            modalType: MODALS.NOTIFICATION_MODAL,
                                            modalProps: {
                                                title: gettext('Item Unlocked'),
                                                body: gettext(`The item was unlocked by "${username}"`),
                                                action: () => {
                                                    newsItem.lock_session = null;
                                                    $scope.reject();
                                                },
                                            },
                                        })));
                                }
                            });
                        });
                })
        ),
        (error) => {
            $scope.reject(error);
            return Promise.reject(error);
        }
        );
}