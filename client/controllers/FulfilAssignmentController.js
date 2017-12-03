import * as actions from '../actions';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {ModalsContainer} from '../components';
import {get} from 'lodash';
import {registerNotifications} from '../utils';
import {WORKSPACE, ASSIGNMENTS, MODALS} from '../constants';
import {getErrorMessage} from '../utils/index';

FulFilAssignmentController.$inject = [
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
];

export function FulFilAssignmentController(
    $scope,
    sdPlanningStore,
    notify,
    gettext,
    lock,
    session,
    userList,
    api,
    $timeout,
    superdeskFlags) {
    const item = get($scope, 'locals.data.item');

    if (get(item, 'slugline', '') === '') {
        notify.error(
            gettext('[SLUGLINE] is a required field')
        );
        $scope.reject();
        return;
    }

    api.find('archive', item._id)
        .then((newsItem) => {
            if (get(newsItem, 'assignment_id')) {
                notify.error(gettext('Item already linked to a Planning item'));
                $scope.reject();
                return Promise.reject();
            }

            if (lock.isLocked(item)) {
                notify.error(gettext('Item already locked.'));
                $scope.reject();
                return Promise.reject();
            }

            if (!lock.isLockedInCurrentSession(newsItem)) {
                newsItem._editable = true;
                return lock.lock(newsItem, false, 'fulfil_assignment')
                    .then(
                        (lockedItem) => Promise.resolve(lockedItem),
                        (error) => {
                            notify.error(
                                gettext(getErrorMessage(error, 'Failed to lock the item.'))
                            );
                            $scope.reject(error);
                            return Promise.reject(error);
                        }
                    );
            }

            return Promise.resolve(newsItem);
        }, (error) => {
            notify.error(
                gettext(getErrorMessage(error, 'Failed to load the item.'))
            );
            $scope.reject(error);
            return Promise.reject(error);
        })
        .then((newsItem) => {
            sdPlanningStore.getStore()
                .then((store) => {
                    store.dispatch(actions.initStore(WORKSPACE.AUTHORING));
                    // set the current desk as the item desk.
                    store.dispatch({
                        type: 'WORKSPACE_CHANGE',
                        payload: {
                            currentDeskId: get(item, 'task.desk'),
                            currentStageId: get(item, 'task.stage'),
                        },
                    });
                    registerNotifications($scope, store);

                    store.dispatch(actions.assignments.ui.loadAssignments('All', null,
                        'Created', 'Asc', [ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED], item.type))
                        .then(() => {
                            store.dispatch(actions.assignments.ui.changeAssignmentListSingleGroupView('TODO'));

                            ReactDOM.render(
                                <Provider store={store}>
                                    <ModalsContainer />
                                </Provider>,
                                document.getElementById('react-placeholder')
                            );

                            store.dispatch(actions.showModal({
                                modalType: MODALS.FULFIL_ASSIGNMENT,
                                modalProps: {
                                    newsItem: item, // scope item
                                    fullscreen: true,
                                    $scope: $scope,
                                },
                            }));

                            $scope.$on('$destroy', () => {
                                store.dispatch(actions.hideModal());
                                $timeout(() => {
                                    store.dispatch(actions.resetStore());
                                }, 1000);

                                // Only unlock the item if it was locked when launching this modal
                                if (get(newsItem, 'lock_session', null) !== null &&
                        get(newsItem, 'lock_action', 'edit') === 'fulfil_assignment' &&
                        lock.isLockedInCurrentSession(newsItem)
                                ) {
                                    lock.unlock(newsItem);
                                }

                                ReactDOM.unmountComponentAtNode(document.getElementById('react-placeholder'));
                            });

                            // handler of item unlock

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
                                            modalType: 'NOTIFICATION_MODAL',
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
                });
        },

        (error) => {
            $scope.reject(error);
            return Promise.reject(error);
        }
        );
}
