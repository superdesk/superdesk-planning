// styles
import './client/styles/index.scss';

// scripts
import planningModule from './client';
import * as ctrl from './client/controllers';


configurePlanning.$inject = ['superdeskProvider', '$injector'];
function configurePlanning(superdesk, $injector) {
    superdesk
        .activity('/planning', {
            label: gettext('Planning'),
            description: gettext('Planning'),
            adminTools: false,
            template: require('./client/views/planning.html'),
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            privileges: {planning: 1},
        })
        .activity('/workspace/assignments', {
            label: gettext('Assignments'),
            priority: 100,
            template: require('./client/views/assignment.html'),
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
        })
        .activity('/locations', {
            label: gettext('Manage Locations'),
            description: gettext('Manage Locations'),
            priority: 200,
            category: superdesk.MENU_MAIN,
            adminTools: true,
            templateUrl: 'locations.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            privileges: {
                planning_locations_management: 1,
            },
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
                },
            ],
            group: 'Planning',
            privileges: {
                planning_planning_management: 1,
                archive: 1,
            },
            additionalCondition: ['lock', 'archiveService', 'item', 'authoring',
                function(lock, archiveService, item, authoring) {
                    return !item.assignment_id &&
                        (!lock.isLocked(item) || lock.isLockedInCurrentSession(item)) &&
                        !archiveService.isPersonal(item) && (authoring.itemActions(item).edit ||
                        authoring.itemActions(item).correct || authoring.itemActions(item).deschedule);
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
                },
            ],
            group: 'Planning',
            privileges: {archive: 1},
            additionalCondition: ['lock', 'archiveService', 'item', 'authoring',
                function(lock, archiveService, item, authoring) {
                    return !item.assignment_id &&
                        (!lock.isLocked(item) || lock.isLockedInCurrentSession(item)) &&
                        !archiveService.isPersonal(item) && !['killed', 'recalled',
                            'unpublished', 'spiked'].includes(item.state);
                }],
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
                },
            ],
            group: 'Planning',
            privileges: {archive: 1},
            additionalCondition: ['lock', 'archiveService', 'item', 'authoring',
                function(lock, archiveService, item, authoring) {
                    return item.assignment_id && (!lock.isLocked(item) || lock.isLockedInCurrentSession(item)) &&
                        !archiveService.isPersonal(item) && (authoring.itemActions(item).edit ||
                        authoring.itemActions(item).correct || authoring.itemActions(item).deschedule);
                }],
        });
}

export default planningModule
    .config(configurePlanning);
