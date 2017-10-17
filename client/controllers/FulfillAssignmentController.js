import * as actions from '../actions'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ModalsContainer } from '../components'
import { get } from 'lodash'
import { registerNotifications } from '../utils'
import { WORKSPACE, ASSIGNMENTS } from '../constants'

FulFillAssignmentController.$inject = [
    '$scope',
    'sdPlanningStore',
    'notify',
    'gettextCatalog',
    'lock',
    'session',
    'userList',
    'api',
]

export function FulFillAssignmentController(
    $scope,
    sdPlanningStore,
    notify,
    gettext,
    lock,
    session,
    userList,
    api)
{
    const item = get($scope, 'locals.data.item')

    if (get(item, 'slugline', '') === '') {
        notify.error(
            gettext('[SLUGLINE] is a required field')
        )
        return $scope.reject()
    }

    api.find('archive', item._id)
    .then((newsItem) => {
        if (get(newsItem, 'assignment_id')) {
            notify.error('Item already linked to a Planning item')
            return Promise.reject()
        }

        if (!lock.isLockedInCurrentSession(newsItem)) {
            newsItem._editable = true
            return lock.lock(newsItem, false, 'fulfill_assignment')
        }

        return Promise.resolve(newsItem)
    })
    .then((newsItem) => {
        sdPlanningStore.getStore()
        .then((store) => {
            store.dispatch(actions.initStore(WORKSPACE.AUTHORING))
            // set the current desk as the item desk.
            store.dispatch({
                type: 'WORKSPACE_CHANGE',
                payload: {
                    currentDeskId: get(newsItem, 'task.desk'),
                    currentStageId: get(newsItem, 'task.stage'),
                },
            })
            registerNotifications($scope, store)

            store.dispatch(actions.assignments.ui.loadAssignments('All', null,
                'Created', 'Asc', ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED, newsItem.type))
            .then(() => {
                ReactDOM.render(
                    <Provider store={store}>
                        <ModalsContainer />
                    </Provider>,
                    document.getElementById('react-placeholder')
                )

                store.dispatch(actions.showModal({
                    modalType: 'FULFILL_ASSIGNMENT',
                    modalProps: {
                        newsItem,
                        fullscreen: true,
                        $scope,
                    },
                }))

                $scope.$on('$destroy', () => {
                    store.dispatch(actions.hideModal())
                    store.dispatch(actions.resetStore())

                    // Only unlock the item if it was locked when launching this modal
                    if (get(newsItem, 'lock_session', null) !== null &&
                        get(newsItem, 'lock_action', 'edit') === 'fulfill_assignment' &&
                        lock.isLockedInCurrentSession(newsItem)
                    ) {
                        lock.unlock(newsItem)
                    }

                    ReactDOM.unmountComponentAtNode(document.getElementById('react-placeholder'))
                })

                // handler of item unlock

                $scope.$on('item:unlock', (_e, data) => {
                    if (data.item === newsItem._id && data.lock_session !== session.sessionId) {
                        store.dispatch(actions.hideModal())
                        store.dispatch(actions.resetStore())

                        userList.getUser(data.user).then(
                            (user) => Promise.resolve(user.display_name),
                            () => Promise.resolve('unknown')
                        )
                        .then((username) => store.dispatch(actions.showModal({
                            modalType: 'NOTIFICATION_MODAL',
                            modalProps: {
                                title: 'Item Unlocked',
                                body: `The item was unlocked by "${username}"`,
                                action: () => {
                                    newsItem.lock_session = null
                                    $scope.reject()
                                },
                            },
                        })))
                    }
                })
            })
        })
    },

    () => $scope.reject())
}
