// styles
import './src/styles/planning.less';

// scripts
import planningModule from './src';

import * as ctrl from './src/controllers';

configurePlanning.$inject = ['superdeskProvider'];
function configurePlanning(superdesk) {
    superdesk
        .activity('/planning', {
            label: gettext('Planning'),
            description: gettext('Planning'),
            priority: 100,
            category: superdesk.MENU_MAIN,
            adminTools: false,
            template: require('./src/views/planning.html'),
            topTemplateUrl: 'scripts/superdesk-dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/superdesk-workspace/views/workspace-sidenav.html'
        })
        .activity('/settings/planning', {
            label: gettext('Planning'),
            template: require('./src/views/settings.html'),
            controller: ctrl.PlanningSettingsController,
            category: superdesk.MENU_SETTINGS,
            priority: 2000
        });
}

export default planningModule.config(configurePlanning);
