import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {registerNotifications} from '../utils';
import * as actions from '../actions';
import {locks} from '../actions';
import {PlanningApp} from '../components';
import {WORKSPACE} from '../constants';

PlanningController.$inject = [
    '$element',
    '$scope',
    '$location',
    'sdPlanningStore',
    '$q',
    'superdeskFlags',
    '$route',
];
export function PlanningController(
    $element,
    $scope,
    $location,
    sdPlanningStore,
    $q,
    superdeskFlags,
    $route
) {
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
                    $scope.$on('$destroy', () => {
                        // Unmount the React application
                        ReactDOM.unmountComponentAtNode($element.get(0));
                        store.dispatch(actions.resetStore());
                    });

                    const App = $scope.vm.app || PlanningApp;

                    $scope.$watch(
                        () => $route.current,
                        (route) => {
                            superdeskFlags.flags.workqueue = !route.href.startsWith('/planning');
                        }
                    );

                    // render the planning application
                    ReactDOM.render(
                        <Provider store={store}>
                            <App />
                        </Provider>,
                        $element.get(0)
                    );
                });
        });
}
