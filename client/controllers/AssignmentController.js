import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from '../utils'
import * as actions from '../actions'
import { AssignmentListContainer } from '../components'

AssignmentController.$inject = [
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
    'session',
]
export function AssignmentController(
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
    metadata,
    session
) {
    // wrap notify methods inside $timeout to ensure it get displayed ASAP
    const _notify = {
        pop: () => $timeout(() => notify.pop()),
        success: (msg) => $timeout(() => notify.success(msg)),
        error: (msg) => $timeout(() => notify.error(msg)),
    }

    // create the application store
    const store = createStore({
        initialState: {},
        extraArguments: {
            api: api,
            $location: $location,
            $scope: $scope,
            $timeout: $timeout,
            vocabularies: vocabularies,
            superdesk: superdesk,
            upload: upload,
            privileges: privileges,
            notifyConnectionService: notifyConnectionService,
            userList: userList,
            desks: desks,
            metadata: metadata,
            session: session,
            notify: _notify,
        },
    })

    // load data in the store
    store.dispatch(actions.loadUsers())
    store.dispatch(actions.loadDesks())
    store.dispatch(actions.loadPrivileges())
    store.dispatch(actions.loadSessionDetails())
    desks.initialize().then(
        () => store.dispatch(actions.loadAssignments('All', null, 'Created', 'Asc'))
    )

    $scope.$on('$destroy', () => {
        // Unmount the React application
        ReactDOM.unmountComponentAtNode($element.get(0))
    })

    ReactDOM.render(
        <Provider store={store}>
            <AssignmentListContainer />
        </Provider>,
        $element.get(0)
    )
}
