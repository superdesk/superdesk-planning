import sinon from 'sinon';

import {ALL_DESKS} from '../../constants';
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
        services.api.find = () => (Promise.resolve(testData.archive[0]));

        assignmentService = new AssignmentsService(
            services.api,
            services.notify,
            services.modal,
            services.sdPlanningStore,
            {config: {planning_fulfil_on_publish_for_desks: ['desk1']}},
            {active: {desk: 'desk1'}},
            testData.config
        );

        sinon.stub(actions.assignments.ui, 'preview').returns({type: 'PREVIEW'});
        sinon.stub(actions.assignments.ui, 'setListGroups');
        sinon.stub(actions.assignments.ui, 'changeListSettings');
        sinon.stub(actions.assignments.ui, 'reloadAssignments').returns(Promise.resolve());
    });

    afterEach(() => {
        restoreSinonStub(actions.assignments.ui.preview);
        restoreSinonStub(actions.assignments.ui.setListGroups);
        restoreSinonStub(actions.assignments.ui.changeListSettings);
        restoreSinonStub(actions.assignments.ui.reloadAssignments);
    });

    describe('onPublishFromAuthoring', () => {
        it('returns if item is already linked to an assignment', (done) => {
            const itemWithAssignment = {
                ...testData.archive[0],
                assignment_id: testData.assignments[0]._id,
            };

            services.api.find = () => (Promise.resolve(itemWithAssignment));
            assignmentService.onPublishFromAuthoring(itemWithAssignment)
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(0);
                    expect(services.sdPlanningStore.initWorkspace.callCount).toBe(0);
                    expect(services.modal.createCustomModal.callCount).toBe(0);

                    done();
                })
                .catch(done.fail);
        });

        it('returns if no matching assignments found', (done) => {
            assignmentService.deployConfig.config.planning_fulfil_on_publish_for_desks = [];
            services.api('assignments').query = sinon.spy(() => Promise.resolve({
                _items: [],
                _meta: {total: 0},
            }));

            assignmentService.onPublishFromAuthoring(testData.archive[0])
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    expect(services.api('assignments').query.args[0]).toEqual([{
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [
                                        {terms: {'assigned_to.state': ['assigned']}},
                                        {term: {'planning.g2_content_type': 'text'}},
                                        {query_string: {query: 'planning.slugline.phrase:("test slugline")'}},
                                        {
                                            range: {
                                                'planning.scheduled': {
                                                    gte: 'now/d',
                                                    lte: 'now/d',
                                                    time_zone: '+10:00',
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                            size: 0,
                        }),
                        page: 1,
                        sort: '[("planning.scheduled", 1)]',
                    }]);

                    expect(services.sdPlanningStore.initWorkspace.callCount).toBe(0);
                    expect(services.modal.createCustomModal.callCount).toBe(0);

                    done();
                })
                .catch(done.fail);
        });

        it('shows FULFIL_ASSIGNMENT modal if assignment(s) found', (done) => {
            assignmentService.deployConfig.config.planning_fulfil_on_publish_for_desks = [];
            assignmentService.desks.active.desk = 'desk2';
            store.initialState.assignment.lists.TODAY.assignmentIds = ['as1'];
            store.initialState.assignment.assignments = {as1: testData.assignments[0]};

            services.api('assignments').query = sinon.spy(() => Promise.resolve({
                _items: [testData.assignments[0]],
                _meta: {total: 1},
            }));

            assignmentService.onPublishFromAuthoring(testData.archive[0])
                .catch(done.fail);

            // Use a setTimeout as the promise is resolved/rejected in the modal
            setTimeout(() => {
                expect(services.api('assignments').query.callCount).toBe(1);
                expect(services.sdPlanningStore.initWorkspace.callCount).toBe(1);
                expect(services.modal.createCustomModal.callCount).toBe(1);
                expect(services.modal.openModal.callCount).toBe(1);

                expect(actions.assignments.ui.setListGroups.callCount).toBe(1);
                expect(actions.assignments.ui.setListGroups.args[0]).toEqual([
                    ['TODAY', 'FUTURE'],
                ]);

                expect(actions.assignments.ui.changeListSettings.callCount).toBe(1);
                expect(actions.assignments.ui.changeListSettings.args[0]).toEqual([{
                    filterBy: 'Desk',
                    searchQuery: 'planning.slugline.phrase:("test slugline")',
                    orderByField: 'Scheduled',
                    orderDirection: 'Asc',
                    filterByType: 'text',
                    filterByPriority: null,
                    selectedDeskId: ALL_DESKS,
                }]);

                expect(actions.assignments.ui.preview.callCount).toBe(1);
                expect(actions.assignments.ui.preview.args[0]).toEqual([
                    testData.assignments[0],
                ]);

                expect(store.dispatch.args[store.dispatch.callCount - 1]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'FULFIL_ASSIGNMENT',
                    modalProps: jasmine.objectContaining({
                        newsItem: testData.archive[0],
                        fullscreen: true,
                        showIgnore: true,
                        ignoreText: 'Don\'t Fulfil Assignment',
                        title: 'Fulfil Assignment with this item?',
                    }),
                }]);

                done();
            }, 0);
        });

        describe('setting for planning_fulfil_on_publish_for_desks', () => {
            it('doesnt show modal if current desk is not configured for it', (done) => {
                assignmentService.desks.active.desk = 'desk2';

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

            it('shows the modal if config is empty', (done) => {
                assignmentService.desks.active.desk = 'desk2';
                assignmentService.deployConfig.config.planning_fulfil_on_publish_for_desks = [];
                store.initialState.assignment.lists.TODAY.assignmentIds = ['as1'];
                store.initialState.assignment.assignments = {as1: testData.assignments[0]};

                services.api('assignments').query = sinon.spy(() => Promise.resolve({
                    _items: [testData.assignments[0]],
                    _meta: {total: 1},
                }));

                assignmentService.onPublishFromAuthoring(testData.archive[0])
                    .catch(done.fail);

                // Use a setTimeout as the promise is resolved/rejected in the modal
                setTimeout(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    expect(services.sdPlanningStore.initWorkspace.callCount).toBe(1);
                    expect(services.modal.createCustomModal.callCount).toBe(1);
                    expect(services.modal.openModal.callCount).toBe(1);

                    expect(actions.assignments.ui.setListGroups.callCount).toBe(1);
                    expect(actions.assignments.ui.setListGroups.args[0]).toEqual([
                        ['TODAY', 'FUTURE'],
                    ]);

                    expect(actions.assignments.ui.changeListSettings.callCount).toBe(1);
                    expect(actions.assignments.ui.changeListSettings.args[0]).toEqual([{
                        filterBy: 'Desk',
                        searchQuery: 'planning.slugline.phrase:("test slugline")',
                        orderByField: 'Scheduled',
                        orderDirection: 'Asc',
                        filterByType: 'text',
                        filterByPriority: null,
                        selectedDeskId: ALL_DESKS,
                    }]);

                    expect(actions.assignments.ui.preview.callCount).toBe(1);
                    expect(actions.assignments.ui.preview.args[0]).toEqual([
                        testData.assignments[0],
                    ]);

                    expect(store.dispatch.args[store.dispatch.callCount - 1]).toEqual([{
                        type: 'SHOW_MODAL',
                        modalType: 'FULFIL_ASSIGNMENT',
                        modalProps: jasmine.objectContaining({
                            newsItem: testData.archive[0],
                            fullscreen: true,
                            showIgnore: true,
                            ignoreText: 'Don\'t Fulfil Assignment',
                            title: 'Fulfil Assignment with this item?',
                        }),
                    }]);

                    done();
                }, 0);
            });
        });
    });
});
