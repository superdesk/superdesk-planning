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
    'gettext'
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
    gettext
) {
    pageTitle.setUrl(gettext('Planning'));
    sdPlanningStore.getStore()
        .then((store) => {
            store.dispatch(actions.initStore(WORKSPACE.PLANNING));
            registerNotifications($scope, store);

            $q.all({
                data: store.dispatch(actions.main.filter()),
                locks: store.dispatch(locks.loadAllLocks()),
                agendas: store.dispatch(actions.fetchAgendas()),
            })
                .then(() => {
                    // Load the current items that are currently open for Preview/Editing
                    store.dispatch(actions.main.openFromURLOrRedux('edit'));
                    store.dispatch(actions.main.openFromURLOrRedux('preview'));

                    $scope.$on('$destroy', () => {
                        // Unmount the React application
                        ReactDOM.unmountComponentAtNode($element.get(0));
                        store.dispatch(actions.resetStore());
                    });

                    $scope.$watch(
                        () => $route.current,
                        (route) => {
                            superdeskFlags.flags.workqueue = !route.href.startsWith('/planning');
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
