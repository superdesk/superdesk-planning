import * as ctrl from './controllers';
import * as services from './services';

export default angular.module('superdesk.planning', [])
    .directive('sdEventsList',
        () => ({ scope: {}, controller: ctrl.EventsListDirectiveController })
    )
    .directive('sdAddEvent',
        () => ({ scope: {}, controller: ctrl.AddEventController })
    )
    .controller('PlanningController', ctrl.PlanningController)
    .controller('PlanningSettingsController', ctrl.PlanningSettingsController)
    .service('planningApi', services.PlanningApiService);
