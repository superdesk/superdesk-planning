import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {registerNotifications} from '../utils';
import * as actions from '../actions';
import {WORKSPACE} from '../constants';
import {PlanningApp} from '../apps';
import eventsApi from '../actions/events/api';


export class PlanningController {
    constructor(
        $element,
        $scope,
        sdPlanningStore,
        superdeskFlags,
        $route,
        pageTitle,
        gettext
    ) {
        this.$element = $element;
        this.$scope = $scope;
        this.superdeskFlags = superdeskFlags;

        this.render = this.render.bind(this);
        this.loadWorkspace = this.loadWorkspace.bind(this);
        this.onDestroy = this.onDestroy.bind(this);
        this.onRouteChange = this.onRouteChange.bind(this);
        this.onMenuChange = this.onMenuChange.bind(this);

        this.store = null;
        this.rendered = false;

        this.prevFlags = {
            workqueue: superdeskFlags.flags.workqueue,
            authoring: superdeskFlags.flags.authoring,
        };

        pageTitle.setUrl(gettext('Planning'));

        $scope.$on('$destroy', this.onDestroy);
        $scope.$watch(() => $route.current, this.onRouteChange);
        $scope.$watch(() => superdeskFlags.flags.menu, this.onMenuChange);

        return sdPlanningStore.initWorkspace(WORKSPACE.PLANNING, this.loadWorkspace)
            .then(this.render);
    }

    onMenuChange(menuChanged) {
        if (this.store) {
            this.store.dispatch({
                type: 'MENU_OPEN',
                payload: menuChanged
            });
        }
    }

    render() {
        ReactDOM.render(
            <Provider store={this.store}>
                <PlanningApp />
            </Provider>,
            document.getElementById('sd-planning-react-container')
        );

        this.rendered = true;
        return Promise.resolve();
    }

    loadWorkspace(store, workspaceChanged) {
        this.store = store;
        registerNotifications(this.$scope, this.store);

        if (!workspaceChanged) {
            return Promise.resolve();
        }

        // To keep the workQueue menu closed while switching to planning
        this.onMenuChange(false);

        this.store.dispatch(actions.main.closePublishQueuePreviewOnWorkspaceChange());

        return Promise.all([
            this.store.dispatch(actions.locks.loadAllLocks()),
            this.store.dispatch(actions.fetchAgendas()),
            this.store.dispatch(actions.users.fetchAndRegisterUserPreferences()),
            this.store.dispatch(actions.events.api.fetchCalendars()),
            this.store.dispatch(actions.autosave.fetchAll()),
            this.store.dispatch(actions.eventsPlanning.ui.fetchFilters()),
            this.store.dispatch(eventsApi.fetchEventTemplates()),
        ])
            .then(() => (
                // Load the current items that are currently open for Preview/Editing
                Promise.all([
                    this.store.dispatch(actions.main.filter()),
                    this.store.dispatch(actions.main.openFromLockActions()),
                    this.store.dispatch(actions.main.openFromURLOrRedux('edit')),
                    this.store.dispatch(actions.main.openFromURLOrRedux('preview')),
                ])
            ));
    }

    onDestroy() {
        if (this.store) {
            this.store.dispatch(actions.resetStore());
        }

        if (this.rendered) {
            // Unmount the React application
            ReactDOM.unmountComponentAtNode(this.$element.get(0));
        }

        this.superdeskFlags.flags.workqueue = this.prevFlags.workqueue;
        this.superdeskFlags.flags.authoring = this.prevFlags.authoring;
    }

    onRouteChange(route) {
        if (route.href.startsWith('/planning')) {
            this.superdeskFlags.flags.workqueue = false;
            this.superdeskFlags.flags.authoring = false;
        }
    }
}

PlanningController.$inject = [
    '$element',
    '$scope',
    'sdPlanningStore',
    'superdeskFlags',
    '$route',
    'pageTitle',
    'gettext',
];
