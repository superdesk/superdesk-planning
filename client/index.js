import * as ctrl from './controllers'

export default angular.module('superdesk.planning', [])
    .directive('sdPlanning',
        () => ({
            scope: {},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.PlanningController
        })
    )
    .controller('PlanningSettingsController', ctrl.PlanningSettingsController)
    .run(['$templateCache', 'ingestSources', 'asset', ($templateCache, ingestSources, asset) => {
        // register new ingest feeding service and custom settings template
        $templateCache.put(
            'superdesk-planning/views/eventFileConfig.html',
            require('./views/eventFileConfig.html')
        )
        ingestSources.registerFeedingService('event_file', {
            label: 'Event File Feed',
            templateUrl: 'superdesk-planning/views/eventFileConfig.html'
        })
    }])
