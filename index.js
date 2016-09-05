// styles
import './src/styles/planning.less';

// scripts
import * as ctrl from './src/controllers';

angular.module('superdesk.planning', [])
    .config(configurePlanning);

configurePlanning.$inject = ['superdeskProvider'];
function configurePlanning(superdesk) {
    superdesk
        .activity('/planning', {
            label: gettext('Planning'),
            description: gettext('Planning'),
            priority: 100,
            category: superdesk.MENU_MAIN,
            adminTools: false,
            privileges: {planning: 1},
            template: require('./src/views/planning.html'),
            topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
        })
        .activity('/settings/Planning', {
            label: gettext('Planning'),
            template: require('./src/views/settings.html'),
            controller: ctrl.PlanningSettingsController,
            category: superdesk.MENU_SETTINGS,
            privileges: {planning: 1},
            priority: 2000
        });
}
