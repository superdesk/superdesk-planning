import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import * as actions from '../actions'
import { AssignmentListContainer } from '../components'
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
        store.dispatch(actions.loadAssignments('All', null, 'Created', 'Asc'))
        .then(() => {
            $scope.$watch(
                () => desks.active,
                () => store.dispatch(actions.reloadAssignments())
            )

            $scope.$on('$destroy', () => {
                // Unmount the React application
                ReactDOM.unmountComponentAtNode($element.get(0))
                store.dispatch(actions.resetStore())
            })

            ReactDOM.render(
                <Provider store={store}>
                    <AssignmentListContainer />
                </Provider>,
                $element.get(0)
            )
        })
    })
}
