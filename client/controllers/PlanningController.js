import React from 'react'
import ReactDOM from 'react-dom'
import { PlanningApp } from '../components'
import { Provider } from 'react-redux'
import { createStore } from '../utils'

PlanningController.$inject = ['$element', '$scope', 'api', 'config', '$location']
export function PlanningController($element, $scope, api, config, $location) {
    let store = createStore({
        initialState: {
            planning: {
                currentAgendaId: $location.search().agenda,
                editorOpened: false,
                currentPlanningId: null,
                agendas: [],
                agendasAreLoading: false,
                plannings: {}, // plannings stored by _id
            },
            config: config
        },
        extraArguments: { api, $location, $scope }
    })
    ReactDOM.render(
        <Provider store={store}>
            <PlanningApp />
        </Provider>,
        $element.get(0)
    )
}
