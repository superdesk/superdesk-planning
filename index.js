// styles
import './client/styles/index.scss'

// scripts
import planningModule from './client'
import * as ctrl from './client/controllers'
import { get } from 'lodash'

configurePlanning.$inject = ['superdeskProvider']
function configurePlanning(superdesk) {
    superdesk
        .activity('/planning', {
            label: gettext('Planning'),
            description: gettext('Planning'),
            adminTools: false,
            template: require('./client/views/planning.html'),
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            privileges: { planning: 1 },
        })
        .activity('/workspace/assignments', {
            label: gettext('Assignments'),
            priority: 100,
            template: require('./client/views/assignment.html'),
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html'
        })
        .activity('planning.addto', {
            label: gettext('Add to Planning'),
            modal: true,
            icon: 'calendar-list',
            priority: 3000,
            controller: ctrl.AddToPlanningController,
            filters: [
                {
                    action: 'list',
                    type: 'archive',
                },
                {
                    action: 'external-app',
                    type: 'addto-planning',
                }
            ],
            group: 'Planning',
            privileges: { planning_planning_management: 1, archive: 1 },
            additionalCondition: ['lock', 'archiveService', 'item', 'authoring',
                function(lock, archiveService, item, authoring) {
                return !item.assignment_id &&
                    (!lock.isLocked(item) || lock.isLockedInCurrentSession(item)) &&
                    !archiveService.isPersonal(item) && (authoring.itemActions(item).edit ||
                    authoring.itemActions(item).correct || authoring.itemActions(item).deschedule)
            }],
        })
        .activity('planning.fulfil', {
            label: gettext('Fulfil Assignment'),
            icon: 'calendar-list',
            modal: true,
            priority: 2000,
            controller: ctrl.FulFilAssignmentController,
            filters: [
                {
                    action: 'list',
                    type: 'archive',
                },
                {
                    action: 'external-app',
                    type: 'fulfill-assignment',
                }
            ],
            group: 'Planning',
            privileges: { archive: 1 },
            additionalCondition: ['lock', 'archiveService', 'item', 'authoring',
                function(lock, archiveService, item, authoring) {
                return !item.assignment_id &&
                    (!lock.isLocked(item) || lock.isLockedInCurrentSession(item)) &&
                    !archiveService.isPersonal(item) && (authoring.itemActions(item).edit ||
                    authoring.itemActions(item).correct || authoring.itemActions(item).deschedule)
            }]
        })
        .activity('planning.unlink', {
            label: gettext('Unlink as Coverage'),
            icon: 'cut',
            priority: 1000,
            controller: ctrl.UnlinkAssignmentController,
            filters: [
                {
                    action: 'list',
                    type: 'archive',
                },
                {
                    action: 'external-app',
                    type: 'unlink-assignment',
                }
            ],
            group: 'Planning',
            privileges: { archive: 1 },
            additionalCondition: ['lock', 'archiveService', 'item', 'authoring',
                function(lock, archiveService, item, authoring) {
                return item.assignment_id && get(item, 'assignment.state') !== 'completed' &&
                    (!lock.isLocked(item) || lock.isLockedInCurrentSession(item)) &&
                    !archiveService.isPersonal(item) && (authoring.itemActions(item).edit ||
                    authoring.itemActions(item).correct || authoring.itemActions(item).deschedule)
            }]
        })
}

runPlanning.$inject = [
    'ingestSources',
    '$templateCache',
]
function runPlanning(
    ingestSources,
    $templateCache,
) {
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
