import React from 'react'
import ReactDOM from 'react-dom'
import { PlanningApp } from '../components'
import { Provider } from 'react-redux'
import { createStore } from '../utils'
import * as actions from '../actions'
import { WS_NOTIFICATION } from '../constants'
import { forEach } from 'lodash'

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
    'notifyConnectionService',
    'userList',
    'desks',
    'metadata',
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
    privileges,
    notifyConnectionService,
    userList,
    desks,
    metadata
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
            notifyConnectionService,
            userList,
            desks,
            metadata,
        },
    })
    // load data in the store
    store.dispatch(actions.loadCVocabularies())
    store.dispatch(actions.loadIngestProviders())
    store.dispatch(actions.loadPrivileges())
    store.dispatch(actions.loadSubjects())
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
    store.dispatch(actions.loadUsers())
    store.dispatch(actions.loadDesks())

    registerNotifications($scope, store)
    $scope.$on('$destroy', () => {
        // Unmount the React application
        ReactDOM.unmountComponentAtNode($element.get(0))
    })

    // render the planning application
    ReactDOM.render(
        <Provider store={store}>
            <PlanningApp />
        </Provider>,
        $element.get(0)
    )
}

/**
 * Registers WebSocket Notifications to Redux Actions
 * @param {scope} $scope - PlanningController scope where notifications are received
 * @param {store} store - The Redux Store used for dispatching actions
 */
export const registerNotifications = ($scope, store) => {
    forEach(actions.notifications, (func, event) => {
        $scope.$on(event, (_e, data) => {
            store.dispatch({
                type: WS_NOTIFICATION,
                payload: {
                    event,
                    data,
                },
            })
            store.dispatch(func(_e, data))
        })
    })
}
