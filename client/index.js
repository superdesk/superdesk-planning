import * as ctrl from './controllers';
import * as svc from './services';
import ng from 'superdesk-core/scripts/core/services/ng';

export default angular.module('superdesk-planning', [])
    .directive('sdPlanning',
        () => ({
            scope: {},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.PlanningController,
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
