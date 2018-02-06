import * as ctrl from './controllers';
import * as svc from './services';
import ng from 'superdesk-core/scripts/core/services/ng';

export default angular.module('superdesk-planning', [])
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
    .directive('sdAssignmentPreview',
        () => ({
            scope: {item: '='},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.AssignmentPreviewController,
        })
    )
    .service('sdPlanningStore', svc.PlanningStoreService)
    .run(['$injector', ng.register]);
