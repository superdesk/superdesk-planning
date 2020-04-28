import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {registerNotifications} from '../utils';
import * as actions from '../actions';
import {AssignmentPreviewContainer} from '../components/Assignments';
import {SidePanel} from '../components/UI/SidePanel';
import {WORKSPACE} from '../constants';

export class AssignmentPreviewController {
    constructor(
        $element,
        $scope,
        sdPlanningStore,
        $q,
        notify,
        gettext
    ) {
        this.$element = $element;
        this.$scope = $scope;
        this.$q = $q;
        this.notify = notify;
        this.gettext = gettext;

        this.render = this.render.bind(this);
        this.loadWorkspace = this.loadWorkspace.bind(this);
        this.onDestroy = this.onDestroy.bind(this);
        this.fetchAssignment = this.fetchAssignment.bind(this);
        this.previewAssignment = this.previewAssignment.bind(this);
        this.onAssignmentIdChanged = this.onAssignmentIdChanged.bind(this);

        this.store = null;

        $scope.$on('$destroy', this.onDestroy);

        sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING, this.loadWorkspace)
            .then(this.render);
    }

    render() {
        ReactDOM.render(
            <Provider store={this.store}>
                <SidePanel
                    shadowRight={true}
                    bg00={true}
                    className="content-container no-padding assignment-preview__side-panel"
                >
                    <AssignmentPreviewContainer hideAvatar={this.$scope.vm.hideAvatar} />
                </SidePanel>
            </Provider>,
            this.$element.get(0)
        );
    }

    loadWorkspace(store, workspaceChanged) {
        this.store = store;
        registerNotifications(this.$scope, this.store);

        return this.$q.all({
            locks: this.store.dispatch(actions.locks.loadAssignmentLocks()),
            agendas: this.store.dispatch(actions.fetchAgendas()),
            assignment: this.fetchAssignment(this.$scope.vm.item.assignment_id),
        })
            .then((results) => {
                if (results.assignment) {
                    this.previewAssignment(results.assignment)
                        .then(() => {
                            this.$scope.$watch('vm.item.assignment_id', this.onAssignmentIdChanged);
                        }, () => {
                            this.notify.error(
                                this.gettext('Failed to fetch assignment information.')
                            );
                        });
                }
            });
    }

    onDestroy() {
        if (this.store) {
            // Unmount the React application
            ReactDOM.unmountComponentAtNode(this.$element.get(0));
            this.store.dispatch(actions.resetStore());
        }
    }

    fetchAssignment(assignmentId) {
        return this.store.dispatch(
            actions.assignments.api.fetchAssignmentById(assignmentId, true)
        );
    }

    previewAssignment(assignment) {
        return this.store.dispatch(
            actions.assignments.ui.preview(assignment)
        );
    }

    onAssignmentIdChanged(newValue, oldValue) {
        if (newValue && oldValue !== newValue) {
            this.fetchAssignment(newValue)
                .then((assignment) => {
                    this.previewAssignment(assignment);
                }, () => {
                    this.notify.error(
                        this.gettext('Failed to fetch assignment information.')
                    );
                });
        }

        if (!newValue) {
            this.store.dispatch(
                actions.assignments.ui.closePreview()
            );
        }
    }
}

AssignmentPreviewController.$inject = [
    '$element',
    '$scope',
    'sdPlanningStore',
    '$q',
    'notify',
    'gettext',
];
