import * as ctrl from './controllers';
import * as svc from './services';
import {WORKSPACE} from './constants';
import ng from 'superdesk-core/scripts/core/services/ng';
import * as actions from './actions';
import {PublishQueuePanel} from './apps';
import {gettext} from './utils';
import {reactToAngular1} from 'superdesk-ui-framework';
import PlanningDetailsWidget, {getItemPlanningInfo} from './components/PlanningDetailsWidget';

import {getSuperdeskApiImplementation} from 'superdesk-core/scripts/core/get-superdesk-api-implementation';
import {superdeskApi} from './superdeskApi';
import {appConfig, extensions} from 'appConfig';
import {updateConfigAfterLoad} from './config';
import {assignConstantLabelTranslations} from './constants';

import {extensionBridge} from './extension_bridge';

window['extension_bridge'] = extensionBridge;

export default angular.module('superdesk-planning', [])
    .directive('sdPlanning',
        () => ({
            scope: {},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.PlanningController,
        })
    )
    .directive('sdPlanningAssignment',
        () => ({
            scope: {},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.AssignmentController,
        })
    )
    .directive('sdAssignmentPreview',
        () => ({
            scope: {item: '=', hideAvatar: '<'},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.AssignmentPreviewController,
        })
    )
    .directive('sdLocationsManagement',
        () => ({
            scope: {},
            bindToController: true,
            controllerAs: 'vm',
            controller: ctrl.LocationsController,
        })
    )
    .component('sdPlanningDetailsWidget', reactToAngular1(PlanningDetailsWidget, ['item']))
    .service('sdPlanningStore', svc.PlanningStoreService)
    .service('assignments', svc.AssignmentsService)
    .config(['workspaceMenuProvider', (workspaceMenuProvider) => {
        workspaceMenuProvider.item({
            id: 'MENU_ITEM_PLANNING_ASSIGNMENTS',
            href: '/workspace/assignments',
            icon: 'tasks',
            label: gettext('Assignments'),
            shortcut: 'ctrl+alt+a',
            if: 'workspaceConfig.assignments && privileges.planning_assignments_view',
            order: 300,
        });

        workspaceMenuProvider.item({
            href: '/planning',
            icon: 'calendar',
            label: gettext('Planning'),
            group: gettext('Planning'),
            if: 'workspaceConfig.planning && privileges.planning',
            order: 1100,
            shortcut: 'ctrl+alt+p',
        });
    }])
    .config(['authoringWidgetsProvider', (authoringWidgetsProvider) => {
        authoringWidgetsProvider.widget('planning-details', {
            label: gettext('Planning Details'),
            icon: 'tasks',
            side: 'right',
            order: 80,
            template: 'planning-details-widget.html',
            display: {
                authoring: true,
            },
            configurable: false,
            badgeAsync: ['item', 'api', (item, api) =>
                getItemPlanningInfo(item, api).then((planning) => planning.coverages.length)],
            isWidgetVisible: (item) => [() => item.assignment_id != null],
        });
    }])
    .run(['$templateCache', ($templateCache) => {
        $templateCache.put('planning-details-widget.html', require('./views/planning-details-widget.html'));
        $templateCache.put('locations.html', require('./views/locations.html'));
    }])
    .run([
        '$injector',
        'sdPlanningStore',
        'extensionPoints',
        'assignments',
        'modal',
        'privileges',
        'lock',
        'session',
        'authoringWorkspace',
        'metadata',
        'preferencesService',
        (
            $injector,
            sdPlanningStore,
            extensionPoints,
            assignments,
            modal,
            privileges,
            lock,
            session,
            authoringWorkspace,
            metadata,
            preferencesService
        ) => {
            updateConfigAfterLoad();

            ng.register($injector);

            const callback = (extension, scope) => (
                sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING, (store) => {
                    store.dispatch(actions.fetchAgendas());
                    extension.props.store = store;
                    scope.$watch('selected.preview', (newValue) => {
                        extension.props.store.dispatch(actions.main.onQueueItemChange(newValue));
                    });
                })
            );

            ng.waitForServicesToBeAvailable()
                .then(() => {
                    Object.assign(
                        superdeskApi,
                        getSuperdeskApiImplementation(
                            'planning-extension',
                            extensions,
                            modal,
                            privileges,
                            lock,
                            session,
                            authoringWorkspace,
                            appConfig,
                            metadata,
                            preferencesService
                        )
                    );
                    assignConstantLabelTranslations();

                    extensionPoints.register('publish_queue:preview',
                        PublishQueuePanel, {}, ['selected'],
                        callback);
                });
        },
    ]);
