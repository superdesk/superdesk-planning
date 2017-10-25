import * as actions from '../actions'
import { getCurrentPlanning } from '../selectors'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ModalsContainer } from '../components'
import { locks } from '../actions'
import { get } from 'lodash'
import { registerNotifications, getErrorMessage } from '../utils'
import { WORKSPACE, MODALS } from '../constants'

AddToPlanningController.$inject = [
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
]

export function AddToPlanningController(
    $scope,
    $location,
    sdPlanningStore,
    $q,
    notify,
    gettext,
    api,
    lock,
    session,
    userList
) {
    const itemId = get($scope, 'locals.data.item._id')
    return api.find('archive', itemId)
    .then((newsItem) => {
        let failed = false

        if (get(newsItem, 'assignment_id')) {
            notify.error(
                gettext('Item already linked to a Planning item')
            )
            failed = true
        }

        if (get(newsItem, 'slugline', '') === '') {
            notify.error(
                gettext('[SLUGLINE] is a required field')
            )
            failed = true
        }

        if (get(newsItem, 'urgency', null) === null) {
            notify.error(
                gettext('[URGENCY] is a required field')
            )
            failed = true
        }

        if (failed) {
            $scope.reject()
            return Promise.reject()
        }

        if (lock.isLocked(newsItem)) {
            notify.error(
                gettext('Item already locked.')
            )
            $scope.reject()
            return Promise.reject()
        }

        if (!lock.isLockedInCurrentSession(newsItem)) {
            newsItem._editable = true
            return lock.lock(newsItem, false, 'add_to_planning')
            .then(
                (lockedItem) => Promise.resolve(lockedItem),
                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to lock the item.')
                    )
                    $scope.reject(error)
                    return Promise.reject(error)
                }
            )
        }

        return Promise.resolve(newsItem)
    }, (error) => {
        notify.error(
            getErrorMessage(error, 'Failed to load the item.')
        )
        $scope.reject(error)
        return Promise.reject(error)
    })
    .then((newsItem) => (
        sdPlanningStore.getStore()
        .then((store) => {
            store.dispatch(actions.initStore(WORKSPACE.AUTHORING))
            registerNotifications($scope, store)

            $q.all({
                agendas: store.dispatch(actions.fetchAgendas())
                    .then(() => {
                        if ($location.search().agenda) {
                            return store.dispatch(actions.selectAgenda($location.search().agenda))
                        }

                        return store.dispatch(
                            actions.fetchSelectedAgendaPlannings()
                        )
                    }),

                locks: store.dispatch(locks.loadAllLocks()),
            })
            .then(() => {
                ReactDOM.render(
                    <Provider store={store}>
                        <ModalsContainer/>
                    </Provider>,
                    document.getElementById('react-placeholder')
                )

                store.dispatch(actions.planning.ui.openAdvancedSearch())

                store.dispatch(actions.showModal({
                    modalType: MODALS.ADD_TO_PLANNING,
                    modalProps: {
                        newsItem,
                        fullscreen: true,
                        $scope,
                    },
                }))

                $scope.$on('$destroy', () => {
                    store.dispatch(actions.planning.ui.closeEditor(
                        getCurrentPlanning(store.getState())
                    ))
                    .then(() => {
                        store.dispatch(actions.hideModal())
                        store.dispatch(actions.resetStore())
                    })

                    // Only unlock the item if it was locked when launching this modal
                    if (get(newsItem, 'lock_session', null) !== null &&
                        get(newsItem, 'lock_action', 'edit') === 'add_to_planning'
                    ) {
                        lock.unlock(newsItem)
                    }

                    ReactDOM.unmountComponentAtNode(document.getElementById('react-placeholder'))
                })

                $scope.$on('item:unlock', (_e, data) => {
                    if (data.item === newsItem._id && data.lock_session !== session.sessionId) {
                        store.dispatch(actions.hideModal())
                        store.dispatch(actions.resetStore())

                        userList.getUser(data.user).then(
                            (user) => Promise.resolve(user.display_name),
                            () => Promise.resolve('unknown')
                        )
                        .then((username) => store.dispatch(actions.showModal({
                            modalType: MODALS.NOTIFICATION_MODAL,
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
    ),
        (error) => {
            $scope.reject(error)
            return Promise.reject(error)
        }
    )
}
