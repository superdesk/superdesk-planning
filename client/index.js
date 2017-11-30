import * as ctrl from './controllers';
import * as svc from './services';

export default angular.module('superdesk.planning', [])
    .directive('sdPlanning',
        () => ({
            scope: {app: '='},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.PlanningController,
        })
    )
    .directive('sdPlanningSettings',
        () => ({
            scope: {},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.PlanningSettingsController,
        })
    )
    .directive('sdPlanningAssignment',
        () => ({
            scope: {},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.AssignmentController,
        })
    )
    .service('sdPlanningStore', svc.PlanningStoreService);
