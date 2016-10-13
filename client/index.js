import * as ctrl from './controllers';
import * as services from './services';

export default angular.module('superdesk.planning', [])
    .directive('sdEventsList',
        () => ({ scope: {}, controller: ctrl.EventsListDirectiveController })
    )
    .directive('sdAddEvent',
        () => ({
            scope: { event: '=' },
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.AddEventController
        })
    )
    .controller('PlanningController', ctrl.PlanningController)
    .controller('PlanningSettingsController', ctrl.PlanningSettingsController)
    .service('addEventForm', services.addEventForm)
    .service('planningApi', services.PlanningApiService);
