import * as actions from '../actions'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ModalsContainer } from '../components'
import { locks } from '../actions'
import { get } from 'lodash'
import { registerNotifications } from '../utils'
import { WORKSPACE } from '../constants'

AddToPlanningController.$inject = [
    '$scope',
    '$location',
    'sdPlanningStore',
    '$q',
    'notify',
    'gettextCatalog',
]

export function AddToPlanningController(
    $scope,
    $location,
    sdPlanningStore,
    $q,
    notify,
    gettextCatalog)
{
    const newsItem = $scope.locals.data.item

    let failed = false
    if (get(newsItem, 'slugline', '') === '') {
        notify.error(
            '[' + gettextCatalog.getString('Slugline').toUpperCase() + '] is a required field'
        )
        failed = true
    }

    if (get(newsItem, 'urgency', null) === null) {
        notify.error(
            '[' + gettextCatalog.getString('Urgency').toUpperCase() + '] is a required field'
        )
        failed = true
    }

    if (failed) {
        return $scope.reject()
    }

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
                    <ModalsContainer />
                </Provider>,
                document.getElementById('react-placeholder')
            )

            store.dispatch(actions.showModal({
                modalType: 'ADD_TO_PLANNING',
                modalProps: {
                    newsItem,
                    fullscreen: true,
                    action: () => {
                        $scope.resolve()
                    },

                    onCancel: () => {
                        $scope.reject()
                    },
                },
            }))

            store.dispatch(actions.planning.ui.openAdvancedSearch())

            $scope.$on('$destroy', () => {
                store.dispatch(actions.hideModal())
                store.dispatch(actions.resetStore())
                ReactDOM.unmountComponentAtNode(document.getElementById('react-placeholder'))
            })
        })
    })
}
