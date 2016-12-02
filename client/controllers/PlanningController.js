import React from 'react'
import ReactDOM from 'react-dom'
import { PlanningApp } from '../components'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import planningApp from '../reducers'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

const loggerMiddleware = createLogger()

PlanningController.$inject = ['$element', 'api', 'config']
export function PlanningController($element, api, config) {
    let store = createStore(
        planningApp,
        { config: config },
        applyMiddleware(
            // include angular services in available actions paramaters
            thunkMiddleware.withExtraArgument({ api }),
            loggerMiddleware
        )
    )
    ReactDOM.render(
        <Provider store={store}>
            <PlanningApp />
        </Provider>,
        $element.get(0)
    )
}
