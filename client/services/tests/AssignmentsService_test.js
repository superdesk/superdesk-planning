import sinon from 'sinon';

import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';
import * as testData from '../../utils/testData';

import {AssignmentsService} from '../AssignmentsService';
import * as actions from '../../actions';

describe('assignments service', () => {
    let store;
    let services;

    let assignmentService;

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;

        assignmentService = new AssignmentsService(
            services.api,
            services.notify,
            services.modal,
            services.sdPlanningStore
        );

        sinon.stub(actions.assignments.ui, 'preview').returns({type: 'PREVIEW'});
    });

    afterEach(() => {
        restoreSinonStub(actions.assignments.ui.preview);
    });

    describe('onPublishFromAuthoring', () => {
        it('returns if item is already linked to an assignment', (done) => {
            assignmentService.onPublishFromAuthoring({
                ...testData.archive[0],
                assignment_id: testData.assignments[0]._id,
            })
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(0);
                    expect(services.sdPlanningStore.initWorkspace.callCount).toBe(0);
                    expect(services.modal.createCustomModal.callCount).toBe(0);

                    done();
                })
                .catch(done.fail);
        });

        it('returns if no matching assignments found', (done) => {
            services.api('assignments').query = sinon.spy(() => Promise.resolve({_items: []}));

            assignmentService.onPublishFromAuthoring(testData.archive[0])
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    expect(services.api('assignments').query.args[0]).toEqual([{
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [
                                        {term: {'assigned_to.state': 'assigned'}},
                                        {query_string: {
                                            query: 'planning.slugline.phrase(\'test slugline\')',
                                            lenient: false,
                                        }},
                                    ],
                                },
                            },
                        }),
                    }]);

                    expect(services.sdPlanningStore.initWorkspace.callCount).toBe(0);
                    expect(services.modal.createCustomModal.callCount).toBe(0);

                    done();
                })
                .catch(done.fail);
        });

        it('shows FULFIL_ASSIGNMENT modal if assignment(s) found', (done) => {
            services.api('assignments').query = sinon.spy(
                () => Promise.resolve({_items: [testData.assignments[0]]})
            );

            assignmentService.onPublishFromAuthoring(testData.archive[0])
                .catch(done.fail);

            // Use a setTimeout as the promise is resolved/rejected in the modal
            setTimeout(() => {
                expect(services.api('assignments').query.callCount).toBe(1);
                expect(services.sdPlanningStore.initWorkspace.callCount).toBe(1);
                expect(services.modal.createCustomModal.callCount).toBe(1);
                expect(services.modal.openModal.callCount).toBe(1);

                expect(store.dispatch.callCount).toBe(5);
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'CHANGE_LIST_VIEW_MODE',
                    payload: 'TODO',
                }]);
                expect(store.dispatch.args[2]).toEqual([{
                    type: 'SET_BASE_ASSIGNMENT_QUERY',
                    payload: {
                        must: [
                            {term: {'assigned_to.state': 'assigned'}},
                            {query_string: {
                                query: 'planning.slugline.phrase(\'test slugline\')',
                                lenient: false,
                            }},
                        ],
                    },
                }]);

                expect(actions.assignments.ui.preview.callCount).toBe(1);
                expect(actions.assignments.ui.preview.args[0]).toEqual([
                    testData.assignments[0],
                ]);

                expect(store.dispatch.args[4]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'FULFIL_ASSIGNMENT',
                    modalProps: jasmine.objectContaining({
                        newsItem: testData.archive[0],
                        fullscreen: true,
                        showIgnore: true,
                        ignoreText: 'Don\'t Fulfil Assignment',
                    }),
                }]);

                done();
            }, 0);
        });
    });
});
