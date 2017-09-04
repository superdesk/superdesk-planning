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
            privileges: { planning: 1 },
        })
        .activity('/settings/planning', {
            label: gettext('Planning'),
            template: require('./client/views/settings.html'),
            category: superdesk.MENU_SETTINGS,
            priority: 2000,
            privileges: { planning: 1 },
        })
        .activity('/workspace/assignments', {
            label: gettext('Assignments'),
            priority: 100,
            template: require('./client/views/assignment.html'),
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html'
        })
}

runPlanning.$inject = ['ingestSources', '$templateCache', '$injector']
function runPlanning(ingestSources, $templateCache, $injector) {
    // register new ingest feeding service and custom settings template
    $templateCache.put(
        'superdesk-planning/views/eventFileConfig.html',
        require('./client/views/eventFileConfig.html')
    )
    $templateCache.put(
        'superdesk-planning/views/eventHttpConfig.html',
        require('./client/views/eventHttpConfig.html')
    )
    $templateCache.put(
        'superdesk-planning/views/eventEmailConfig.html',
        require('./client/views/eventEmailConfig.html')
    )
    ingestSources.registerFeedingService('event_file', {
        label: 'Event File Feed',
        templateUrl: 'superdesk-planning/views/eventFileConfig.html',
    })
    ingestSources.registerFeedingService('event_http', {
        label: 'Event HTTP Feed',
        templateUrl: 'superdesk-planning/views/eventHttpConfig.html',
    })
    ingestSources.registerFeedingService('event_email', {
        label: 'Event Email Feed',
        templateUrl: 'superdesk-planning/views/eventEmailConfig.html',
    })
}

export default planningModule
    .config(configurePlanning)
    .run(runPlanning)
