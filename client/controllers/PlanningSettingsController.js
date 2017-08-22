import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { registerNotifications } from '../utils'
import * as actions from '../actions'
import { PlanningSettingsApp } from '../components'

PlanningSettingsController.$inject = [
    '$scope',
    '$element',
    'sdPlanningStore',
]
export function PlanningSettingsController(
    $scope,
    $element,
    sdPlanningStore
) {
    sdPlanningStore.getStore()
    .then((store) => {
        store.dispatch(actions.initStore())
        registerNotifications($scope, store)

        // load data in the store
        store.dispatch(actions.fetchAgendas())
        .then(() => {
            $scope.$on('$destroy', () => {
                // Unmount the React application
                ReactDOM.unmountComponentAtNode($element.get(0))
                store.dispatch(actions.resetStore())
            })

            ReactDOM.render(
                <Provider store={store}>
                    <PlanningSettingsApp/>
                </Provider>, $element.get(0))
        })
    })
}
