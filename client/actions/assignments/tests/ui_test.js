import assignmentsUi from '../ui';
import assignmentsApi from '../api';
import planningApi from '../../planning/api';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import * as testData from '../../../utils/testData';

describe('actions.assignments.ui', () => {
    let store;
    let services;
    let data;

    const errorMessage = {data: {_message: 'Failed!'}};

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        sinon.stub(assignmentsApi, 'link').callsFake(() => (Promise.resolve()));
        sinon.stub(assignmentsApi, 'lock').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(assignmentsApi, 'unlock').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(assignmentsApi, 'query').callsFake(() => (Promise.resolve({_items: []})));

        sinon.stub(planningApi, 'lock').callsFake((item) => Promise.resolve(item));
        sinon.stub(planningApi, 'unlock').callsFake((item) => Promise.resolve(item));
    });

    afterEach(() => {
        restoreSinonStub(assignmentsApi.link);
        restoreSinonStub(assignmentsApi.lock);
        restoreSinonStub(assignmentsApi.unlock);
        restoreSinonStub(assignmentsApi.query);
        restoreSinonStub(planningApi.lock);
        restoreSinonStub(planningApi.unlock);
    });

    describe('onFulFilAssignment', () => {
        beforeEach(() => {
            store.initialState.modal = {
                modalType: 'FULFIL_ASSIGNMENT',
                modalProps: {
                    $scope: {
                        reject: sinon.spy(),
                        resolve: sinon.spy(),
                    },
                    newsItem: {_id: 'item1'},
                },
            };
            store.initialState.workspace.currentWorkspace = 'AUTHORING';
        });

        it('call succeeds', (done) => {
            store.test(done, assignmentsUi.onFulFilAssignment({_id: 'as1'}))
                .then(() => {
                    expect(assignmentsApi.link.callCount).toBe(1);
                    expect(assignmentsApi.link.args[0]).toEqual([{_id: 'as1'}, {_id: 'item1'}]);
                    expect(services.notify.success.callCount).toBe(1);
                    done();
                });
        });

        it('call fails', (done) => {
            restoreSinonStub(assignmentsApi.link);
            sinon.stub(assignmentsApi, 'link').callsFake(() => (Promise.reject(errorMessage)));
            store.test(done, assignmentsUi.onFulFilAssignment({_id: 'as1'}))
                .then(() => { /* no-op */ }, (error) => {
                    expect(assignmentsApi.link.callCount).toBe(1);
                    expect(assignmentsApi.link.args[0]).toEqual([{_id: 'as1'}, {_id: 'item1'}]);
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    done();
                });
        });
    });

    describe('assignment list actions', () => {
        it('queryAndSetAssignmentListGroups will appply filter to the query', (done) => {
            store.test(done, assignmentsUi.queryAndSetAssignmentListGroups(['in_progress']))
                .then(() => {
                    expect(assignmentsApi.query.callCount).toBe(1);
                    expect(assignmentsApi.query.args[0][0].states).toEqual(['in_progress']);
                    done();
                });
        });

        it('queryAndSetAssignmentListGroups will use default page as 1 in query', (done) => {
            store.test(done, assignmentsUi.queryAndSetAssignmentListGroups(['in_progress']))
                .then(() => {
                    expect(assignmentsApi.query.callCount).toBe(1);
                    expect(assignmentsApi.query.args[0][0].page).toEqual(1);
                    done();
                });
        });

        it('reloadAssignments will query all list groups if not state filter is passed', (done) => {
            store.test(done, assignmentsUi.reloadAssignments())
                .then(() => {
                    expect(assignmentsApi.query.callCount).toBe(3);
                    done();
                });
        });

        it('loadMoreAssignments will increment page number', (done) => {
            store.test(done, assignmentsUi.loadMoreAssignments(['in_progress']))
                .then(() => {
                    expect(assignmentsApi.query.callCount).toBe(1);
                    expect(assignmentsApi.query.args[0][0].page).toEqual(2);
                    done();
                });
        });
    });

    describe('lockPlanning', () => {
        it('Locks the planning item associated with the Assignment', (done) => (
            store.test(done, assignmentsUi.lockPlanning({planning_item: 'plan1'}, 'locker'))
                .then(() => {
                    expect(planningApi.lock.callCount).toBe(1);
                    expect(planningApi.lock.args[0]).toEqual([{_id: 'plan1'}, 'locker']);

                    done();
                })
        ));

        it('Notifies the user if the planning lock fails', (done) => {
            restoreSinonStub(planningApi.lock);
            sinon.stub(planningApi, 'lock').callsFake(() => Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.lockPlanning(
                {planning_item: 'plan1'},
                'locker'
            ))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('lockAssignment', () => {
        it('Locks the Assignment', (done) => (
            store.test(done, assignmentsUi.lockAssignment(data.assignments[0], 'locker'))
                .then(() => {
                    expect(assignmentsApi.lock.callCount).toBe(1);
                    expect(assignmentsApi.lock.args[0]).toEqual([data.assignments[0], 'locker']);

                    done();
                })
        ));

        it('Notifies the user if the assignment lock fails', (done) => {
            restoreSinonStub(assignmentsApi.lock);
            sinon.stub(assignmentsApi, 'lock').callsFake(() => Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.lockAssignment(
                data.assignments[0],
                'locker'
            ))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('unlockPlanning', () => {
        it('Unlocks the planning item associated with the Assignment', (done) => (
            store.test(done, assignmentsUi.unlockPlanning({planning_item: 'plan1'}))
                .then(() => {
                    expect(planningApi.unlock.callCount).toBe(1);
                    expect(planningApi.unlock.args[0]).toEqual([{_id: 'plan1'}]);

                    done();
                })
        ));

        it('Notifies the user if the planning unlock fails', (done) => {
            restoreSinonStub(planningApi.unlock);
            sinon.stub(planningApi, 'unlock').callsFake(() => Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.unlockPlanning({planning_item: 'plan1'}))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('unlockAssignment', () => {
        it('Unlocks the Assignment', (done) => (
            store.test(done, assignmentsUi.unlockAssignment(data.assignments[0]))
                .then(() => {
                    expect(assignmentsApi.unlock.callCount).toBe(1);
                    expect(assignmentsApi.unlock.args[0]).toEqual([data.assignments[0]]);

                    done();
                })
        ));

        it('Notifies the user if the assignment unlock fails', (done) => {
            restoreSinonStub(assignmentsApi.unlock);
            sinon.stub(assignmentsApi, 'unlock').callsFake(() => Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.unlockAssignment(data.assignments[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('lockAssignmentAndPlanning', () => {
        beforeEach(() => {
            sinon.stub(assignmentsUi, 'lockAssignment').callsFake((item) => Promise.resolve(item));
            sinon.stub(assignmentsUi, 'lockPlanning').callsFake((item) => Promise.resolve(
                {_id: item.planning_item}
            ));
        });

        afterEach(() => {
            restoreSinonStub(assignmentsUi.lockAssignment);
            restoreSinonStub(assignmentsUi.lockPlanning);
        });

        it('locks both Assignment and Planning and returns the locked Assignment', (done) => (
            store.test(done, assignmentsUi.lockAssignmentAndPlanning(data.assignments[0], 'locker'))
                .then((item) => {
                    expect(item).toEqual(data.assignments[0]);

                    expect(assignmentsUi.lockPlanning.callCount).toBe(1);
                    expect(assignmentsUi.lockPlanning.args[0]).toEqual([data.assignments[0], 'locker']);

                    expect(assignmentsUi.lockAssignment.callCount).toBe(1);
                    expect(assignmentsUi.lockAssignment.args[0]).toEqual([
                        data.assignments[0],
                        'locker',
                    ]);

                    done();
                })
        ));

        it('Notifies the user if locking Assignment fails', (done) => {
            restoreSinonStub(assignmentsUi.lockAssignment);
            restoreSinonStub(assignmentsUi.lockPlanning);

            restoreSinonStub(assignmentsApi.lock);
            sinon.stub(assignmentsApi, 'lock').callsFake(() => Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.lockAssignmentAndPlanning(
                data.assignments[0],
                'locker'
            ))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });

        it('Notifies the user if locking Planning fails', (done) => {
            restoreSinonStub(assignmentsUi.lockAssignment);
            restoreSinonStub(assignmentsUi.lockPlanning);

            restoreSinonStub(planningApi.lock);
            sinon.stub(planningApi, 'lock').callsFake(() => Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.lockAssignmentAndPlanning(
                data.assignments[0],
                'locker'
            ))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('unlockAssignmentAndPlanning', () => {
        beforeEach(() => {
            sinon.stub(assignmentsUi, 'unlockAssignment').callsFake(
                (item) => Promise.resolve(item)
            );
            sinon.stub(assignmentsUi, 'unlockPlanning').callsFake((item) => Promise.resolve(
                {_id: item.planning_item}
            ));
        });

        afterEach(() => {
            restoreSinonStub(assignmentsUi.unlockAssignment);
            restoreSinonStub(assignmentsUi.unlockPlanning);
        });

        it('unlocks both Assignment and Planning and returns the locked Assignment', (done) => (
            store.test(done, assignmentsUi.unlockAssignmentAndPlanning(data.assignments[0]))
                .then((item) => {
                    expect(item).toEqual(data.assignments[0]);

                    expect(assignmentsUi.unlockPlanning.callCount).toBe(1);
                    expect(assignmentsUi.unlockPlanning.args[0]).toEqual([data.assignments[0]]);

                    expect(assignmentsUi.unlockAssignment.callCount).toBe(1);
                    expect(assignmentsUi.unlockAssignment.args[0]).toEqual([data.assignments[0]]);

                    done();
                })
        ));

        it('Notifies the user if unlocking Assignment fails', (done) => {
            restoreSinonStub(assignmentsUi.unlockAssignment);
            restoreSinonStub(assignmentsUi.unlockPlanning);

            restoreSinonStub(assignmentsApi.unlock);
            sinon.stub(assignmentsApi, 'unlock').returns(Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.unlockAssignmentAndPlanning(data.assignments[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });

        it('Notifies the user if unlocking Planning fails', (done) => {
            restoreSinonStub(assignmentsUi.unlockAssignment);
            restoreSinonStub(assignmentsUi.unlockPlanning);

            restoreSinonStub(planningApi.unlock);
            sinon.stub(planningApi, 'unlock').callsFake(() => Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.unlockAssignmentAndPlanning(data.assignments[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('showRemoveAssignmentModal', () => {
        beforeEach(() => {
            sinon.stub(assignmentsUi, 'lockAssignmentAndPlanning').callsFake(
                (item) => Promise.resolve(item)
            );
        });

        afterEach(() => {
            restoreSinonStub(assignmentsUi.lockAssignmentAndPlanning);
        });

        it('locks both Assignment and Planning and displays the confirmation dialog', (done) => (
            store.test(done, assignmentsUi.showRemoveAssignmentModal(data.assignments[0]))
                .then((item) => {
                    expect(item).toEqual(data.assignments[0]);

                    expect(assignmentsUi.lockAssignmentAndPlanning.callCount).toBe(1);
                    expect(assignmentsUi.lockAssignmentAndPlanning.args[0]).toEqual([
                        data.assignments[0],
                        'remove_assignment',
                    ]);

                    expect(store.dispatch.callCount).toBe(2);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'SHOW_MODAL',
                        modalType: 'CONFIRMATION',
                        modalProps: jasmine.objectContaining(
                            {body: 'Are you sure you want to remove the Assignment?'}
                        ),
                    }]);

                    done();
                })
        ));

        it('returns Promise.reject on locking error', (done) => {
            restoreSinonStub(assignmentsUi.lockAssignmentAndPlanning);
            sinon.stub(assignmentsUi, 'lockAssignmentAndPlanning').returns(
                Promise.reject(errorMessage)
            );

            return store.test(done, assignmentsUi.showRemoveAssignmentModal(data.assignments[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    describe('_removeAssignment', () => {
        beforeEach(() => {
            sinon.stub(assignmentsApi, 'removeAssignment').callsFake(
                (item) => Promise.resolve(item)
            );
        });

        afterEach(() => {
            restoreSinonStub(assignmentsApi.removeAssignment);
        });

        it('Executes api.removeAssignment and notifies user of success', (done) => (
            store.test(done, assignmentsUi.removeAssignment(data.assignments[0]))
                .then(() => {
                    expect(assignmentsApi.removeAssignment.callCount).toBe(1);
                    expect(assignmentsApi.removeAssignment.args[0]).toEqual([data.assignments[0]]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Assignment removed']);

                    done();
                })
        ));

        it('Notifies user if removeAssignment fails', (done) => {
            restoreSinonStub(assignmentsApi.removeAssignment);
            sinon.stub(assignmentsApi, 'removeAssignment').returns(Promise.reject(errorMessage));

            return store.test(done, assignmentsUi.removeAssignment(data.assignments[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('openArchivePreview', () => {
        beforeEach(() => {
            sinon.stub(assignmentsUi, 'closePreview');
        });

        afterEach(() => {
            restoreSinonStub(assignmentsApi.loadArchiveItem);
            restoreSinonStub(assignmentsUi.closePreview);
        });

        it('openArchivePreview does nothing if no content is linked', (done) => {
            sinon.stub(assignmentsApi, 'loadArchiveItem');
            return store.test(done, assignmentsUi.openArchivePreview(data.assignments[0]))
                .then(() => {
                    expect(assignmentsApi.loadArchiveItem.callCount).toBe(0);
                    expect(assignmentsUi.closePreview.callCount).toBe(0);
                    expect(services.authoringWorkspace.view.callCount).toBe(0);
                    done();
                });
        });

        it('openArchivePreview fetches the archive item and opens the authoring workspace in view mode', (done) => {
            sinon.stub(assignmentsApi, 'loadArchiveItem').returns(Promise.resolve(testData.archive[0]));
            data.assignments[0].item_ids = ['item1'];
            return store.test(done, assignmentsUi.openArchivePreview(data.assignments[0]))
                .then((item) => {
                    expect(item).toEqual(testData.archive[0]);

                    expect(assignmentsApi.loadArchiveItem.callCount).toBe(1);
                    expect(assignmentsApi.loadArchiveItem.args[0]).toEqual([data.assignments[0]]);

                    expect(assignmentsUi.closePreview.callCount).toBe(1);

                    expect(services.authoringWorkspace.view.callCount).toBe(1);
                    expect(services.authoringWorkspace.view.args[0]).toEqual([testData.archive[0]]);
                    done();
                });
        });

        it('openArchivePreview returns rejected Promise on failure to load the archive item', (done) => {
            sinon.stub(assignmentsApi, 'loadArchiveItem').returns(Promise.reject(errorMessage));
            data.assignments[0].item_ids = ['item1'];
            return store.test(done, assignmentsUi.openArchivePreview(data.assignments[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(assignmentsApi.loadArchiveItem.callCount).toBe(1);
                    expect(assignmentsUi.closePreview.callCount).toBe(0);
                    expect(services.authoringWorkspace.view.callCount).toBe(0);

                    done();
                });
        });
    });

    describe('updatePreviewItemOnRouteUpdate', () => {
        const newAssignment = {
            _id: 'as3',
            _type: 'assignments',
            type: 'assignment',
            coverage_id: 'c2',
            planning_item: 'p1',
            assigned_to: {
                user: 'ident1',
                desk: 'desk1',
            },
            planning: {
                ednote: 'Photo coverage',
                scheduled: '2016-10-15T14:01:11',
                g2_content_type: 'photo',
            },
        };

        const restrictedAssignment = {
            _id: 'as4',
            _type: 'assignments',
            type: 'assignment',
            coverage_id: 'c2',
            planning_item: 'p1',
            assigned_to: {
                user: 'ident2',
                desk: 'desk2',
            },
            planning: {
                ednote: 'Photo coverage',
                scheduled: '2016-10-15T14:01:11',
                g2_content_type: 'photo',
            },
        };

        beforeEach(() => {
            delete store.services.$location.search;
            sinon.stub(assignmentsUi, 'preview').returns(Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(assignmentsUi.preview);
            restoreSinonStub(assignmentsApi.fetchAssignmentById);
            restoreSinonStub(store.services.$location.search);
        });

        it('Previews assignment if already in store', (done) => {
            store.services['$location'] = {
                ...store.services['$location'],
                search: sinon.stub().callsFake(() => ({assignment: 'as1'})),
            };

            return store.test(done, assignmentsUi.updatePreviewItemOnRouteUpdate())
                .then(() => {
                    expect(assignmentsUi.preview.callCount).toBe(1);
                    done();
                });
        });

        it('Fetches assignment if not in store', (done) => {
            store.services['$location'] = {
                ...store.services['$location'],
                search: sinon.stub().callsFake(() => ({assignment: 'as3'}))
            };

            sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(() => (Promise.resolve(newAssignment)));
            return store.test(done, assignmentsUi.updatePreviewItemOnRouteUpdate())
                .then(() => {
                    expect(assignmentsUi.preview.callCount).toBe(1);
                    done();
                });
        });

        it('Does not preview assignment if user is not part of assignment item desk', (done) => {
            store.services['$location'] = {
                ...store.services['$location'],
                search: sinon.stub().callsFake(() => ({assignment: 'as4'})),
            };

            sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(() => (Promise.resolve(restrictedAssignment)));
            return store.test(done, assignmentsUi.updatePreviewItemOnRouteUpdate())
                .then(() => {
                    expect(assignmentsUi.preview.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(
                        ['Insufficient privileges to view the assignment']);
                    done();
                });
        });

        it('Notifies if assignment does not exist', (done) => {
            store.services['$location'] = {
                ...store.services['$location'],
                search: sinon.stub().callsFake(() => ({assignment: 'as5'})),
            };

            sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(() => (Promise.reject()));
            return store.test(done, assignmentsUi.updatePreviewItemOnRouteUpdate())
                .then(() => {
                    expect(assignmentsUi.preview.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(
                        ['Assignment does not exist']);
                    done();
                });
        });
    });
});
