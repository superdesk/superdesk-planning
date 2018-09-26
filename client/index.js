import * as ctrl from './controllers';
import * as svc from './services';
import {WORKSPACE} from './constants';
import ng from 'superdesk-core/scripts/core/services/ng';
import * as actions from './actions';
import {PublishQueuePanel} from './apps';


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
    .service('sdPlanningStore', svc.PlanningStoreService)
    .run(['$injector', 'sdPlanningStore', 'extensionPoints', ($injector, sdPlanningStore, extensionPoints) => {
        ng.register($injector);

        //
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
                extensionPoints.register('publish_queue:preview',
                    PublishQueuePanel, {}, ['selected'],
                    callback);
            });
    }]);
