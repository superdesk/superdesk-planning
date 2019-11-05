import sinon from 'sinon';

import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {createTestStore, assignmentUtils} from '../../../utils';
import {registerNotifications} from '../../../utils/notifications';
import * as selectors from '../../../selectors';
import assignmentsUi from '../ui';
import assignmentsApi from '../api';
import main from '../../main';
import assignmentNotifications from '../notifications';
import planningApi from '../../planning/api';

describe('actions.assignments.notification', () => {
    let store;
    let testStore;

    beforeEach(() => {
        store = getTestActionStore();
        store.init();
    });

    const setTestStore = () => {
        testStore = createTestStore({
            initialState: store.initialState,
            extraArguments: {
                api: store.services.api,
                $location: store.services.$location,
            },
        });
    };

    const getCoverage = (payload) => {
        const plans = selectors.planning.storedPlannings(testStore.getState());
        const planning1 = plans[payload.planning];

        return planning1.coverages.find((cov) =>
            cov.coverage_id === payload.coverage);
    };

    describe('websocket', () => {
        const delay = 0;
        let $rootScope;

        beforeEach(inject((_$rootScope_) => {
            sinon.stub(assignmentNotifications, 'onAssignmentCreated').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(assignmentNotifications, 'onAssignmentUpdated').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(assignmentNotifications, 'onAssignmentRemoved').returns(Promise.resolve());
            $rootScope = _$rootScope_;
            registerNotifications($rootScope, store);
            $rootScope.$digest();
        }));

        afterEach(() => {
            restoreSinonStub(assignmentNotifications.onAssignmentCreated);
            restoreSinonStub(assignmentNotifications.onAssignmentUpdated);
            restoreSinonStub(assignmentNotifications.onAssignmentRemoved);
        });

        it('`assignments:created` calls onAssignmentCreated', (done) => {
            $rootScope.$broadcast('assignments:created', {item: 'p2'});

            setTimeout(() => {
                expect(assignmentNotifications.onAssignmentCreated.callCount).toBe(1);
                expect(assignmentNotifications.onAssignmentCreated.args[0][1])
                    .toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`assignments:updated` calls onAssignmentUpdated', (done) => {
            $rootScope.$broadcast('assignments:updated', {item: 'p2'});

            setTimeout(() => {
                expect(assignmentNotifications.onAssignmentUpdated.callCount).toBe(1);
                expect(assignmentNotifications.onAssignmentUpdated.args[0][1])
                    .toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`assignments:removed` calls onAssignmentRemoved', (done) => {
            $rootScope.$broadcast('assignments:removed', {assignment: 'as1'});

            setTimeout(() => {
                expect(assignmentNotifications.onAssignmentRemoved.callCount).toBe(1);
                expect(assignmentNotifications.onAssignmentRemoved.args[0][1])
                    .toEqual({assignment: 'as1'});

                done();
            }, delay);
        });
    });

    describe('`assignment:created`', () => {
        beforeEach(() => {
            sinon.stub(assignmentsApi, 'query').callsFake(() => (Promise.resolve({_items: []})));
            sinon.stub(assignmentsApi, 'receivedAssignments').callsFake(() => { /* no-op */ });
            sinon.stub(assignmentUtils, 'getCurrentSelectedDeskId').returns('desk1');
        });

        afterEach(() => {
            restoreSinonStub(assignmentsApi.query);
            restoreSinonStub(assignmentsApi.receivedAssignments);
            restoreSinonStub(assignmentsUi.setInList);
            restoreSinonStub(assignmentUtils.getCurrentSelectedDeskId);
        });

        it('query assignments on create', (done) => {
            let payload = {
                item: 'as1',
                assigned_desk: 'desk1',
                assignment_state: 'assigned',
            };

            return store.test(done, assignmentNotifications.onAssignmentCreated({}, payload))
                .then(() => {
                    expect(assignmentsApi.query.callCount).toBe(2);
                    expect(assignmentsApi.receivedAssignments.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('`assignment:update`', () => {
        beforeEach(() => {
            sinon.stub(assignmentsUi, 'reloadAssignments').callsFake(
                () => () => Promise.resolve()
            );
            sinon.stub(assignmentUtils, 'getCurrentSelectedDeskId').returns('desk1');
            sinon.stub(planningApi, 'loadPlanningByIds').callsFake(
                () => () => Promise.resolve()
            );
        });

        afterEach(() => {
            restoreSinonStub(assignmentsUi.reloadAssignments);
            restoreSinonStub(assignmentUtils.getCurrentSelectedDeskId);
            restoreSinonStub(main.fetchItemHistory);
            restoreSinonStub(planningApi.loadPlanningByIds);
        });

        it('update planning on assignment update', (done) => {
            setTestStore();

            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                coverage: 'c1',
                planning: 'p1',
                original_assigned_desk: 'desk1',
                assignment_state: 'assigned',
            };
            let coverage1 = getCoverage(payload);

            expect(coverage1.assigned_to.desk).toBe('desk1');
            expect(coverage1.assigned_to.state).toBe(undefined);

            testStore.dispatch(assignmentNotifications.onAssignmentUpdated({}, payload))
                .then(() => {
                    expect(planningApi.loadPlanningByIds.callCount).toBe(1);
                    expect(planningApi.loadPlanningByIds.args).toEqual([
                        [['p1']],
                    ]);
                    expect(assignmentsUi.reloadAssignments.callCount).toBe(2);
                    expect(assignmentsUi.reloadAssignments.args).toEqual([
                        [['assigned']],
                        [[undefined]],
                    ]);
                    done();
                })
                .catch(done.fail);
        });

        it('assignment list groups are reloaded when assignment moves groups', (done) => {
            store.initialState.assignment.assignments.as1.assigned_to.state = 'assigned';
            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                coverage: 'c1',
                planning: 'p1',
                original_assigned_desk: 'desk1',
                assignment_state: 'in_progress',
            };

            return store.test(done, assignmentNotifications.onAssignmentUpdated({}, payload))
                .then(() => {
                    expect(assignmentsUi.reloadAssignments.callCount).toBe(2);
                    done();
                })
                .catch(done.fail);
        });

        it('updates planning-history if planning item in store', (done) => {
            sinon.stub(main, 'fetchItemHistory').callsFake(
                () => (Promise.resolve())
            );
            store.initialState.workspace.currentDeskId = 'desk1';
            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                coverage: 'c1',
                planning: 'p1',
                original_assigned_desk: 'desk1',
                assignment_state: 'assigned',
            };
            const plans = selectors.planning.storedPlannings(store.getState());
            const planning1 = plans[payload.planning];
            const coverage1 = planning1.coverages.find((cov) =>
                cov.coverage_id === payload.coverage);

            expect(coverage1.assigned_to.desk).toBe('desk1');
            expect(coverage1.assigned_to.state).toBe(undefined);

            return store.test(done, assignmentNotifications.onAssignmentUpdated({}, payload))
                .then(() => {
                    expect(main.fetchItemHistory.callCount).toBe(1);
                    expect(main.fetchItemHistory.args[0]).toEqual([jasmine.objectContaining({
                        _id: planning1._id,
                        type: planning1.type,
                    })]);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('`assignment lock`', () => {
        beforeEach(() => {
            sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(() => (
                Promise.resolve(store.initialState.assignment.assignments.as1)));
        });

        afterEach(() => {
            restoreSinonStub(assignmentsApi.fetchAssignmentById);
        });

        it('calls LOCK_ASSIGNMENT action', (done) => {
            let payload = {
                item: 'as1',
                user: 'ident1',
                lock_session: 'session1',
                lock_action: 'edit',
                lock_time: '2099-10-15T14:30+0000',
                etag: 'etag1',
            };

            return store.test(done, assignmentNotifications.onAssignmentLocked({}, payload))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(2);
                    expect(assignmentsApi.fetchAssignmentById.callCount).toBe(1);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'LOCK_ASSIGNMENT',
                        payload: {
                            assignment: {
                                ...store.initialState.assignment.assignments.as1,
                                lock_action: 'edit',
                                lock_user: 'ident1',
                                lock_session: 'session1',
                                lock_time: '2099-10-15T14:30+0000',
                                _etag: 'etag1',
                            },
                        },
                    }]);
                    done();
                })
                .catch(done.fail);
        });

        it('calls UNLOCK_ASSIGNMENT action', (done) => {
            let payload = {
                item: 'as1',
                etag: 'etag1',
            };

            return store.test(done, assignmentNotifications.onAssignmentUnlocked({}, payload))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(2);
                    expect(assignmentsApi.fetchAssignmentById.callCount).toBe(1);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'UNLOCK_ASSIGNMENT',
                        payload: {
                            assignment: {
                                ...store.initialState.assignment.assignments.as1,
                                lock_action: null,
                                lock_user: null,
                                lock_session: null,
                                lock_time: null,
                                _etag: 'etag1',
                            },
                        },
                    }]);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('`assignment:completed`', () => {
        beforeEach(() => {
            sinon.stub(assignmentsUi, 'queryAndGetMyAssignments').callsFake(
                () => () => (Promise.resolve())
            );
            sinon.stub(assignmentUtils, 'getCurrentSelectedDeskId').returns('desk1');
            sinon.stub(planningApi, 'loadPlanningByIds').callsFake(
                () => () => (Promise.resolve())
            );
        });

        afterEach(() => {
            restoreSinonStub(assignmentsUi.reloadAssignments);
            restoreSinonStub(assignmentsUi.queryAndGetMyAssignments);
            restoreSinonStub(assignmentUtils.getCurrentSelectedDeskId);
            restoreSinonStub(planningApi.loadPlanningByIds);
        });

        it('update planning on assignment complete', (done) => {
            setTestStore();

            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                assignment_state: 'completed',
                coverage: 'c1',
                planning: 'p1',
                original_assigned_desk: 'desk1',
            };
            let coverage1 = getCoverage(payload);

            expect(coverage1.assigned_to.desk).toBe('desk1');
            expect(coverage1.assigned_to.state).toBe(undefined);
            sinon.stub(assignmentsUi, 'reloadAssignments').callsFake(
                () => () => Promise.resolve()
            );

            testStore.dispatch(assignmentNotifications.onAssignmentUpdated({}, payload))
                .then(() => {
                    coverage1 = getCoverage(payload);

                    expect(planningApi.loadPlanningByIds.callCount).toBe(1);
                    expect(planningApi.loadPlanningByIds.args).toEqual([
                        [['p1']],
                    ]);
                    expect(assignmentsUi.reloadAssignments.callCount).toBe(2);
                    expect(assignmentsUi.reloadAssignments.args).toEqual([
                        [['completed']],
                        [[undefined]],
                    ]);
                    done();
                })
                .catch(done.fail);
        });

        it('unlocks assignment on assignment complete', (done) => {
            restoreSinonStub(assignmentsUi.fetchAssignmentById);
            sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(() => (
                Promise.resolve(store.initialState.assignment.assignments.as1)));

            store.initialState.locks.assignment = {as1: {user: 'ident1'}};
            store.initialState.workspace.currentDeskId = 'desk1';
            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                assignment_state: 'completed',
                coverage: 'c1',
                planning: 'p1',
            };

            return store.test(done, assignmentNotifications.onAssignmentUpdated({}, payload))
                .then(() => {
                    expect(assignmentsApi.fetchAssignmentById.callCount).toBe(1);
                    expect(store.dispatch.args[5]).toEqual([{
                        type: 'UNLOCK_ASSIGNMENT',
                        payload: {
                            assignment: {
                                ...store.initialState.assignment.assignments.as1,
                                lock_action: null,
                                lock_user: null,
                                lock_session: null,
                                lock_time: null,
                            },
                        },
                    }]);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('assignments:removed', () => {
        beforeEach(() => {
            sinon.stub(assignmentsUi, 'queryAndGetMyAssignments').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(assignmentsUi.queryAndGetMyAssignments);
        });

        it('calls `REMOVE_ASSIGNMENT` action', (done) => (
            store.test(done, assignmentNotifications.onAssignmentRemoved(
                {},
                {assignments: ['as1']}
            ))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(5);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'REMOVE_ASSIGNMENT',
                        payload: {assignments: ['as1']},
                    }]);

                    done();
                })
        ).catch(done.fail));

        it('notifies the user if they are viewing the removed Assignment', (done) => {
            store.initialState.assignment.currentAssignmentId = 'as1';

            return store.test(done, assignmentNotifications.onAssignmentRemoved(
                {},
                {assignments: ['as1']}
            ))
                .then(() => {
                    expect(store.services.notify.warning.callCount).toBe(1);
                    expect(store.services.notify.warning.args[0]).toEqual(
                        ['The Assignment you were viewing was removed.']
                    );

                    done();
                })
                .catch(done.fail);
        });
    });
});
