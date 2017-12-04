import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {registerNotifications} from '../utils';
import * as actions from '../actions';
import {AssignmentPreviewContainer} from '../components';
import {WORKSPACE} from '../constants';

AssignmentPreviewController.$inject = [
    '$element',
    '$scope',
    'sdPlanningStore',
    '$q',
    'notify',
    'gettext',
];
export function AssignmentPreviewController(
    $element,
    $scope,
    sdPlanningStore,
    $q,
    notify,
    gettext
) {
    const fetchAssignment = (store, id) => store.dispatch(
        actions.assignments.api.fetchAssignmentById(id, true)
    );

    const previewAssignment = (store, assignment) => (
        store.dispatch(actions.assignments.ui.preview(assignment))
    );

    sdPlanningStore.getStore()
        .then((store) => {
            store.dispatch(actions.initStore(WORKSPACE.AUTHORING));
            registerNotifications($scope, store);

            $q.all({
                locks: store.dispatch(actions.locks.loadAssignmentLocks()),
                agendas: store.dispatch(actions.fetchAgendas()),
                assignment: fetchAssignment(store, $scope.vm.item.assignment_id),
            })
                .then((results) => {
                    if (results.assignment) {
                        previewAssignment(store, results.assignment)
                            .then(() => {
                                $scope.$watch('vm.item.assignment_id', (newValue, oldValue) => {
                                    if (newValue && oldValue !== newValue) {
                                        fetchAssignment(store, newValue)
                                            .then((assignment) => {
                                                previewAssignment(store, assignment);
                                            }, () => {
                                                notify.error(gettext('Failed to fetch assignment information.'));
                                            });
                                    }

                                    if (!newValue) {
                                        store.dispatch(actions.assignments.ui.closePreview);
                                    }
                                });

                                $scope.$on('$destroy', () => {
                                    // Unmount the React application
                                    ReactDOM.unmountComponentAtNode($element.get(0));
                                    store.dispatch(actions.resetStore());
                                });

                                ReactDOM.render(
                                    <Provider store={store}>
                                        <div className="content-container AssignmentPreviewTab">
                                            <AssignmentPreviewContainer />
                                        </div>
                                    </Provider>,
                                    $element.get(0)
                                );
                            }, () => {
                                notify.error(gettext('Failed to fetch assignment information.'));
                            });
                    }
                }, () => {
                    notify.error(gettext('Failed to fetch assignment information.'));
                });
        });
}
