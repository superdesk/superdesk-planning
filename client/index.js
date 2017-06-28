import * as ctrl from './controllers'

export default angular.module('superdesk.planning', [])
    .directive('sdPlanning',
        () => ({
            scope: {},
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
