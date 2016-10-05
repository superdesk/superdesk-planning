import * as ctrl from './controllers';

export default angular.module('superdesk.planning', [])
    .directive('sdEvent', [
        function() {
            return {
                scope: {},
                template: require('./views/event.html'),
                controller: ctrl.EventDirectiveController
            };
        }
    ])
    .controller('PlanningController', ctrl.PlanningController)
    .controller('PlanningSettingsController', ctrl.PlanningSettingsController);
