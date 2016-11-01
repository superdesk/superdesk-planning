import React from 'react'
import ReactDOM from 'react-dom'
import { Planning } from '../components'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import planningApp from '../reducers'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

const loggerMiddleware = createLogger()

PlanningModalController.$inject = ['$element', 'api', 'config']
export function PlanningModalController($element, api, config) {
    let store = createStore(
        planningApp,
        { 'config': config },
        applyMiddleware(
            // include angular services in available actions paramaters
            thunkMiddleware.withExtraArgument({ api }),
            loggerMiddleware
        )
    )
    ReactDOM.render(
        <Provider store={store}>
            <Planning />
        </Provider>,
        $element.get(0)
    )
}
