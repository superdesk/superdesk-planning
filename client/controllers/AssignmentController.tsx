import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {cloneDeep} from 'lodash';
import {registerNotifications} from '../utils';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {AssignmentsApp} from '../apps';
import {WORKSPACE, ASSIGNMENTS} from '../constants';

export class AssignmentController {
    constructor(
        $element,
        $scope,
        $location,
        $route,
        desks,
        sdPlanningStore,
        pageTitle,
        gettext,
        privileges
    ) {
        this.$element = $element;
        this.$scope = $scope;
        this.$location = $location;
        this.$route = $route;
        this.desks = desks;
        this.isPlanningAssignmentsDeskPrivilege = privileges.userHasPrivileges({planning_assignments_desk: 1});

        this.render = this.render.bind(this);
        this.loadWorkspace = this.loadWorkspace.bind(this);
        this.onDestroy = this.onDestroy.bind(this);
        this.onDeskChange = this.onDeskChange.bind(this);

        this.currentRouteParams = $route.current.params;
        this.handleRouteUpdate = this.handleRouteUpdate.bind(this);

        this.store = null;
        this.rendered = false;

        pageTitle.setUrl(gettext('Assignments'));

        $scope.$on('$routeUpdate', this.handleRouteUpdate);
        $scope.$on('$destroy', this.onDestroy);
        $scope.$watch(() => desks.active, this.onDeskChange);

        return sdPlanningStore.initWorkspace(WORKSPACE.ASSIGNMENTS, this.loadWorkspace)
            .then(this.render);
    }

    render() {
        if (this.$element) {
            ReactDOM.render(
                <Provider store={this.store}>
                    <AssignmentsApp />
                </Provider>,
                document.getElementById('sd-planning-react-container')
            );
        }

        this.rendered = true;
        return Promise.resolve();
    }

    loadWorkspace(store, workspaceChanged) {
        this.store = store;
        registerNotifications(this.$scope, store);

        if (!workspaceChanged) {
            return Promise.resolve();
        }

        this.store.dispatch(actions.main.closePublishQueuePreviewOnWorkspaceChange());
        this.store.dispatch(actions.assignments.ui.setListGroups([
            ASSIGNMENTS.LIST_GROUPS.TODO.id,
            ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id,
            ASSIGNMENTS.LIST_GROUPS.COMPLETED.id,
        ]));

        return Promise.all([
            this.store.dispatch(actions.locks.loadAssignmentLocks()),
            this.store.dispatch(actions.fetchAgendas()),
            this.store.dispatch(actions.users.fetchAndRegisterUserPreferences())
                .then(() => this.store.dispatch(actions.assignments.ui.loadDefaultListSort()))
                .then(() => this.onDeskChange()),
        ]);
    }

    handleRouteUpdate(angularEvent, nextRoute) {
        if (
            nextRoute.params.assignment != null
            && nextRoute.params.assignment !== this.currentRouteParams.assignment
        ) {
            this.currentRouteParams = nextRoute.params;
            this.store.dispatch(actions.assignments.ui.updatePreviewItemOnRouteUpdate());
        }
    }

    onDestroy() {
        this.$scope.$off('$routeUpdate', this.handleRouteUpdate);

        if (this.rendered && this.$element) {
            // Unmount the React application
            ReactDOM.unmountComponentAtNode(this.$element.get(0));
        }

        if (this.store) {
            this.store.dispatch(actions.resetStore());
        }
    }

    onDeskChange() {
        if (!this.store) {
            return Promise.resolve();
        }

        const listSettings = cloneDeep(selectors.getAssignmentListSettings(this.store.getState()));

        listSettings.selectedDeskId = this.desks.getCurrentDeskId();
        listSettings.filterBy = listSettings.selectedDeskId
        && this.isPlanningAssignmentsDeskPrivilege ? 'Desk' : 'User';

        this.store.dispatch(
            actions.assignments.ui.changeListSettings(listSettings)
        );

        return this.store.dispatch(actions.assignments.ui.reloadAssignments())
            .then(() => this.store.dispatch(actions.assignments.ui.updatePreviewItemOnRouteUpdate()))
            .then(() => {
                this.$scope.$watch(
                    () => this.$location.search().item,
                    () => this.store.dispatch(actions.assignments.ui.updatePreviewItemOnRouteUpdate())
                );
            });
    }
}

AssignmentController.$inject = [
    '$element',
    '$scope',
    '$location',
    '$route',
    'desks',
    'sdPlanningStore',
    'pageTitle',
    'gettext',
    'privileges',
];
