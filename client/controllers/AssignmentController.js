import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { get } from 'lodash'
import { registerNotifications } from '../utils'
import * as actions from '../actions'
import { AssignmentsApp } from '../components'
import { WORKSPACE } from '../constants'

AssignmentController.$inject = [
    '$element',
    '$scope',
    'desks',
    'sdPlanningStore',
]
export function AssignmentController(
    $element,
    $scope,
    desks,
    sdPlanningStore
) {
    sdPlanningStore.getStore()
    .then((store) => {
        store.dispatch(actions.initStore(WORKSPACE.ASSIGNMENTS))
        registerNotifications($scope, store)
        store.dispatch(actions.locks.loadAssignmentLocks())
        .then(() => {
            $scope.$watch(
                () => desks.active,
                () => {
                    // update the store with workspace
                    store.dispatch({
                        type: 'WORKSPACE_CHANGE',
                        payload: {
                            currentDeskId: get(desks, 'active.desk'),
                            currentStageId: get(desks, 'active.stage'),
                        },
                    })
                    return store.dispatch(actions.assignments.ui.reloadAssignments())
                }
            )

            $scope.$on('$destroy', () => {
                // Unmount the React application
                ReactDOM.unmountComponentAtNode($element.get(0))
                store.dispatch(actions.resetStore())
            })

            ReactDOM.render(
                <Provider store={store}>
                    <AssignmentsApp />
                </Provider>,
                $element.get(0)
            )
        })
    })
}
