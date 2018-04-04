import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {registerNotifications} from '../utils';
import * as actions from '../actions';
import {locks} from '../actions';
import {WORKSPACE} from '../constants';
import {PlanningApp} from '../apps';

PlanningController.$inject = [
    '$element',
    '$scope',
    '$location',
    'sdPlanningStore',
    '$q',
    'superdeskFlags',
    '$route',
    'pageTitle',
    'gettext',
    'preferencesService'
];
export function PlanningController(
    $element,
    $scope,
    $location,
    sdPlanningStore,
    $q,
    superdeskFlags,
    $route,
    pageTitle,
    gettext,
    preferencesService
) {
    const prevFlags = {
        workqueue: superdeskFlags.flags.workqueue,
        authoring: superdeskFlags.flags.authoring
    };

    pageTitle.setUrl(gettext('Planning'));

    sdPlanningStore.getStore()
        .then((store) => {
            store.dispatch(actions.initStore(WORKSPACE.PLANNING));
            registerNotifications($scope, store);

            $q.all({
                data: store.dispatch(actions.main.filter()),
                locks: store.dispatch(locks.loadAllLocks()),
                agendas: store.dispatch(actions.fetchAgendas()),
                userPreferences: preferencesService.get()
            })
                .then((result) => {
                    // Load the current items that are currently open for Preview/Editing
                    store.dispatch(actions.main.openFromURLOrRedux('edit'));
                    store.dispatch(actions.main.openFromURLOrRedux('preview'));
                    store.dispatch(actions.users.setUserPreferences(result.userPreferences || {}));

                    $scope.$on('$destroy', () => {
                        // Unmount the React application
                        ReactDOM.unmountComponentAtNode($element.get(0));
                        store.dispatch(actions.resetStore());
                        superdeskFlags.flags.workqueue = prevFlags.workqueue;
                        superdeskFlags.flags.authoring = prevFlags.authoring;
                    });

                    $scope.$watch(
                        () => $route.current,
                        (route) => {
                            if (route.href.startsWith('/planning')) {
                                superdeskFlags.flags.workqueue = false;
                                superdeskFlags.flags.authoring = false;
                            }
                        }
                    );

                    // render the planning application
                    ReactDOM.render(
                        <Provider store={store}>
                            <PlanningApp />
                        </Provider>,
                        $element.get(0)
                    );
                });
        });
}
