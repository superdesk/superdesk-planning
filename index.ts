// styles
import './client/styles/index.scss';

import {IArticle} from 'superdesk-api';
import {superdeskApi} from './client/superdeskApi';

// scripts
import planningModule from './client';
import * as ctrl from './client/controllers';
import {gettext} from './client/utils/gettext';
import {isContentLinkToCoverageAllowed} from './client/utils/archive';
import ng from 'superdesk-core/scripts/core/services/ng';

configurePlanning.$inject = ['superdeskProvider'];
function configurePlanning(superdesk) {
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
            group: gettext('Planning'),
            privileges: {
                planning_planning_management: 1,
                archive: 1,
            },
            additionalCondition: ['archiveService', 'item', 'authoring',
                function(archiveService, item: IArticle, authoring) {
                    return !item.assignment_id &&
                        !archiveService.isPersonal(item) &&
                        !superdeskApi.entities.article.isLockedInOtherSession(item) &&
                        !['correction'].includes(item.state) &&
                        isContentLinkToCoverageAllowed(item) &&
                        (
                            authoring.itemActions(item).edit ||
                            authoring.itemActions(item).correct ||
                            authoring.itemActions(item).deschedule
                        );
                }],
        });
}

window.addEventListener('planning:fulfilassignment', (event: CustomEvent) => {
    const element = window.$(document.createElement('div'));
    const localScope = ng.get('$rootScope').$new(true);
    const handleDestroy = () => {
        localScope.$broadcast('$destroy');
        element[0].remove();
    };

    localScope.resolve = handleDestroy;
    localScope.reject = handleDestroy;
    localScope.locals = {data: {item: event.detail.item}};

    new ctrl.FulFilAssignmentController(
        element,
        localScope,
        ng.get('sdPlanningStore'),
        ng.get('notify'),
        ng.get('gettext'),
        ng.get('lock'),
        ng.get('session'),
        ng.get('userList'),
        ng.get('api'),
        ng.get('$timeout'),
        ng.get('superdeskFlags'),
        ng.get('desks')
    );
});


window.addEventListener('planning:unlinkfromcoverage', (event: CustomEvent) => {
    ctrl.UnlinkAssignmentController(
        event.detail,
        ng.get('notify'),
        ng.get('gettext'),
        ng.get('api'),
        ng.get('lock'),
    );
});

export default planningModule
    .config(configurePlanning);
