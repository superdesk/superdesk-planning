// styles
import './client/styles/index.scss'

// scripts
import planningModule from './client'

import * as ctrl from './client/controllers'

configurePlanning.$inject = ['superdeskProvider']
function configurePlanning(superdesk) {
    superdesk
        .activity('/planning', {
            label: gettext('Planning'),
            description: gettext('Planning'),
            priority: 100,
            category: superdesk.MENU_MAIN,
            adminTools: false,
            template: require('./client/views/planning.html'),
            topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
        })
        .activity('/settings/planning', {
            label: gettext('Planning'),
            template: require('./client/views/settings.html'),
            controller: ctrl.PlanningSettingsController,
            controllerAs: 'vm',
            category: superdesk.MENU_SETTINGS,
            priority: 2000
        })
}

runPlanning.$inject = ['ingestSources', '$templateCache', 'workspaces', '$rootScope']
function runPlanning(ingestSources, $templateCache, workspaces, $rootScope) {
    workspaces.registerExtraItem({
        title: 'Planning',
        route: 'planning',
        iconClass: 'icon-calendar',
        // this event is listen on the planning controller
        onClick: () => ($rootScope.$broadcast('PlanningMenuItemClicked'))
    })
    // register new ingest feeding service and custom settings template
    $templateCache.put(
        'superdesk-planning/views/eventFileConfig.html',
        require('./client/views/eventFileConfig.html')
    )
    $templateCache.put(
        'superdesk-planning/views/eventHttpConfig.html',
        require('./client/views/eventHttpConfig.html')
    )
    ingestSources.registerFeedingService('event_file', {
        label: 'Event File Feed',
        templateUrl: 'superdesk-planning/views/eventFileConfig.html'
    })
    ingestSources.registerFeedingService('event_http', {
        label: 'Event HTTP Feed',
        templateUrl: 'superdesk-planning/views/eventHttpConfig.html'
    })
}

export default planningModule
    .config(configurePlanning)
    .run(runPlanning)
