import React from 'react'
import ReactDOM from 'react-dom'
import { PlanningApp } from '../components'
import { Provider } from 'react-redux'
import { createStore } from '../utils'

PlanningController.$inject = ['$element', 'api', 'config']
export function PlanningController($element, api, config) {
    let store = createStore({
        initialState: {
            planning: {
                currentAgendaId: undefined,
                editorOpened: false,
                currentPlanningId: null,
                agendas: [],
                agendasAreLoading: false,
                plannings: {}, // plannings stored by _id
            },
            config: config
        },
        extraArguments: { api }
    })
    ReactDOM.render(
        <Provider store={store}>
            <PlanningApp />
        </Provider>,
        $element.get(0)
    )
}
