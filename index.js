// styles
import './client/styles/planning.scss'

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

export default planningModule.config(configurePlanning)
