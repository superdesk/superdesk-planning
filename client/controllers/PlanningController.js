import React from 'react'
import ReactDOM from 'react-dom'
import { PlanningApp } from '../containers'
import { Provider } from 'react-redux'
import { createStore } from '../utils'
import * as actions from '../actions'

PlanningController.$inject = [
    '$element',
    '$scope',
    'api',
    'config',
    '$location',
    '$timeout',
    'vocabularies',
    'superdesk',
    'upload',
    'notify',
    'privileges',
]
export function PlanningController(
    $element,
    $scope,
    api,
    config,
    $location,
    $timeout,
    vocabularies,
    superdesk,
    upload,
    notify,
    privileges
) {
    // create the application store
    const store = createStore({
        initialState: { config: config },
        extraArguments: {
            api,
            $location,
            $scope,
            $timeout,
            vocabularies,
            superdesk,
            upload,
            notify,
            privileges,
        },
    })
    // load data in the store
    store.dispatch(actions.loadCVocabularies())
    store.dispatch(actions.loadIngestProviders())
    store.dispatch(actions.loadPrivileges())
    store.dispatch(actions.fetchEvents({
        fulltext: JSON.parse(
            $location.search().searchEvent || '{}'
        ).fulltext,
    }))
    store.dispatch(actions.fetchAgendas())
    .then(() => {
        if ($location.search().agenda) {
            return store.dispatch(actions.selectAgenda($location.search().agenda))
        }
    })
    // render the planning application
    ReactDOM.render(
        <Provider store={store}>
            <PlanningApp />
        </Provider>,
        $element.get(0)
    )
}
