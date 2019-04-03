import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {cloneDeep} from 'lodash';
import {registerNotifications} from '../utils';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {AssignmentsApp} from '../apps';
import {WORKSPACE} from '../constants';

export class AssignmentController {
    constructor(
        $element,
        $scope,
        $location,
        desks,
        sdPlanningStore,
        pageTitle,
        gettext
    ) {
        this.$element = $element;
        this.$scope = $scope;
        this.$location = $location;
        this.desks = desks;

        this.render = this.render.bind(this);
        this.loadWorkspace = this.loadWorkspace.bind(this);
        this.onDestroy = this.onDestroy.bind(this);
        this.onDeskChange = this.onDeskChange.bind(this);

        this.store = null;
        this.rendered = false;

        pageTitle.setUrl(gettext('Assignments'));

        $scope.$on('$destroy', this.onDestroy);
        $scope.$watch(() => desks.active, this.onDeskChange);

        return sdPlanningStore.initWorkspace(WORKSPACE.ASSIGNMENTS, this.loadWorkspace)
            .then(this.render);
    }

    render() {
        ReactDOM.render(
            <Provider store={this.store}>
                <AssignmentsApp />
            </Provider>,
            document.getElementById('sd-planning-react-container')
        );

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
        this.onDeskChange();

        return Promise.all([
            this.store.dispatch(actions.locks.loadAssignmentLocks()),
            this.store.dispatch(actions.fetchAgendas()),
        ]);
    }

    onDestroy() {
        if (this.rendered) {
            // Unmount the React application
            ReactDOM.unmountComponentAtNode(this.$element.get(0));
        }

        if (this.store) {
            this.store.dispatch(actions.resetStore());
        }
    }

    onDeskChange() {
        if (!this.store) {
            return;
        }

        const listSettings = cloneDeep(selectors.getAssignmentListSettings(this.store.getState()));

        listSettings.selectedDeskId = this.desks.getCurrentDeskId();
        listSettings.filterBy = listSettings.selectedDeskId ? 'Desk' : 'User';
        this.store.dispatch(actions.assignments.ui.changeListSettings(
            listSettings.filterBy,
            listSettings.searchQuery,
            listSettings.orderByField,
            listSettings.orderDirection,
            listSettings.filterByType,
            listSettings.filterByPriority,
            listSettings.selectedDeskId
        ));

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
    'desks',
    'sdPlanningStore',
    'pageTitle',
    'gettext',
];
