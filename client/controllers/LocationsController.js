import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {registerNotifications, gettext} from '../utils';
import * as actions from '../actions';
import {WORKSPACE} from '../constants';
import {LocationsApp} from '../apps';

export class LocationsController {
    constructor(
        $element,
        $scope,
        sdPlanningStore,
        $route,
        pageTitle
    ) {
        this.$element = $element;
        this.$scope = $scope;

        this.render = this.render.bind(this);
        this.loadWorkspace = this.loadWorkspace.bind(this);
        this.onDestroy = this.onDestroy.bind(this);

        this.store = null;
        this.rendered = false;

        pageTitle.setUrl(gettext('Locations'));
        $scope.$on('$destroy', this.onDestroy);

        return sdPlanningStore.initWorkspace(WORKSPACE.LOCATIONS, this.loadWorkspace)
            .then(this.render);
    }

    render() {
        ReactDOM.render(
            <Provider store={this.store}>
                <LocationsApp />
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
    }

    onDestroy() {
        if (this.store) {
            this.store.dispatch(actions.resetStore());
        }

        if (this.rendered) {
            // Unmount the React application
            ReactDOM.unmountComponentAtNode(this.$element.get(0));
        }
    }
}

LocationsController.$inject = [
    '$element',
    '$scope',
    'sdPlanningStore',
    '$route',
    'pageTitle',
];