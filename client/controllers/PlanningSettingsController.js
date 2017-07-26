import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, registerNotifications } from '../utils'
import * as actions from '../actions'
import { PlanningSettingsApp } from '../components'

PlanningSettingsController.$inject = [
    '$scope',
    '$element',
    'api',
    'config',
    'superdesk',
    'notify',
    'privileges',
    'userList',
    'session',
    '$location',
    '$timeout',
]
export function PlanningSettingsController(
    $scope,
    $element,
    api,
    config,
    superdesk,
    notify,
    privileges,
    userList,
    session,
    $location,
    $timeout
) {

    // wrap notify methods inside $timeout to ensure it get displayed ASAP
    const _notify = {
        pop: () => $timeout(() => notify.pop()),
        success: (msg) => $timeout(() => notify.success(msg)),
        error: (msg) => $timeout(() => notify.error(msg)),
    }
    // create the application store
    const store = createStore({
        initialState: { config: config },
        extraArguments: {
            api,
            $scope,
            superdesk,
            notify: _notify,
            privileges,
            userList,
            session,
            $location,
            $timeout,
        },
    })
    // load data in the store
    store.dispatch(actions.loadPrivileges())
    store.dispatch(actions.fetchAgendas())
    store.dispatch(actions.loadUsers())
    store.dispatch(actions.loadSessionDetails())

    registerNotifications($scope, store)
    $scope.$on('$destroy', () => {
        // Unmount the React application
        ReactDOM.unmountComponentAtNode($element.get(0))
    })

    ReactDOM.render(
        <Provider store={store}>
            <PlanningSettingsApp/>
        </Provider>, $element.get(0))
}
