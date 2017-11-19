import sinon from 'sinon'
import { getTestActionStore, restoreSinonStub } from '../../../utils/testUtils'
import { registerNotifications } from '../../../utils/notifications'
import * as selectors from '../../../selectors'
import assignmentsUi from '../ui'
import assignmentsApi from '../api'
import assignmentNotifications from '../notifications'

describe('actions.assignments.notification', () => {
    let store

    beforeEach(() => {
        store = getTestActionStore()
        store.init()
    })

    describe('websocket', () => {
        const delay = 0
        let $rootScope

        beforeEach(inject((_$rootScope_) => {
            sinon.stub(assignmentNotifications, 'onAssignmentCreated').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(assignmentNotifications, 'onAssignmentUpdated').callsFake(
                () => (Promise.resolve())
            )
            $rootScope = _$rootScope_
            registerNotifications($rootScope, store)
            $rootScope.$digest()
        }))

        afterEach(() => {
            restoreSinonStub(assignmentNotifications.onAssignmentCreated)
            restoreSinonStub(assignmentNotifications.onAssignmentUpdated)
        })

        it('`assignment:created` calls onAssignmentCreated', (done) => {
            $rootScope.$broadcast('assignments:created', { item: 'p2' })

            setTimeout(() => {
                expect(assignmentNotifications.onAssignmentCreated.callCount).toBe(1)
                expect(assignmentNotifications.onAssignmentCreated.args[0][1])
                .toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`assignment:updated` calls onAssignmentUpdated', (done) => {
            $rootScope.$broadcast('assignments:updated', { item: 'p2' })

            setTimeout(() => {
                expect(assignmentNotifications.onAssignmentUpdated.callCount).toBe(1)
                expect(assignmentNotifications.onAssignmentUpdated.args[0][1])
                .toEqual({ item: 'p2' })

                done()
            }, delay)
        })
    })

    describe('`assignment:created`', () => {
        afterEach(() => {
            restoreSinonStub(assignmentsApi.query)
            restoreSinonStub(assignmentsApi.receivedAssignments)
            restoreSinonStub(assignmentsUi.setInList)
        })

        it('query assignments on create', (done) => {
            store.initialState.workspace.currentDeskId = 'desk1'
            let payload = {
                item: 'as1',
                assigned_desk: 'desk1',
                assignment_state: 'assigned',
            }
            sinon.stub(assignmentsApi, 'query').callsFake(() => (Promise.resolve({ _items: [] })))
            sinon.stub(assignmentsApi, 'receivedAssignments').callsFake(() => {})

            return store.test(done, assignmentNotifications.onAssignmentCreated({}, payload))
            .then(() => {
                expect(assignmentsApi.query.callCount).toBe(1)
                expect(assignmentsApi.receivedAssignments.callCount).toBe(1)
                done()
            })
        })
    })

    describe('`assignment:update`', () => {
        afterEach(() => {
            restoreSinonStub(assignmentsUi.reloadAssignments)
        })

        it('update planning on assignment update', (done) => {
            store.initialState.workspace.currentDeskId = 'desk1'
            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                coverage: 'c1',
                planning: 'p1',
                original_assigned_desk: 'desk1',
                assignment_state: 'assigned',
            }
            const plans = selectors.getStoredPlannings(store.getState())
            const planning1 = plans[payload.planning]
            const coverage1 = planning1.coverages.find((cov) =>
                cov.coverage_id === payload.coverage)

            expect(coverage1.assigned_to.desk).toBe('desk1')
            expect(coverage1.assigned_to.state).toBe(undefined)
            sinon.stub(assignmentsUi, 'reloadAssignments').callsFake(() => Promise.resolve())

            return store.test(done, assignmentNotifications.onAssignmentUpdated({}, payload))
            .then(() => {
                expect(coverage1.assigned_to.desk).toBe('desk2')
                expect(coverage1.assigned_to.state).toBe('assigned')
                expect(assignmentsUi.reloadAssignments.callCount).toBe(1)
                done()
            })
        })

        it('assignment list groups are reloaded when assignment moves groups', (done) => {
            store.initialState.workspace.currentDeskId = 'desk1'
            store.initialState.assignment.assignments.as1.assigned_to.state = 'assigned'
            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                coverage: 'c1',
                planning: 'p1',
                original_assigned_desk: 'desk1',
                assignment_state: 'in_progress',
            }

            sinon.stub(assignmentsUi, 'reloadAssignments').callsFake(() => Promise.resolve())

            return store.test(done, assignmentNotifications.onAssignmentUpdated({}, payload))
            .then(() => {
                expect(assignmentsUi.reloadAssignments.callCount).toBe(2)
                done()
            })
        })
    })

    describe('`assignment lock`', () => {
        beforeEach(() => {
            sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(() => (
                Promise.resolve(store.initialState.assignment.assignments.as1)))
        })

        afterEach(() => {
            restoreSinonStub(assignmentsApi.fetchAssignmentById)
        })

        it('calls LOCK_ASSIGNMENT action', (done) => {
            let payload = {
                item: 'as1',
                user: 'ident1',
                lock_session: 'session1',
                lock_action: 'edit',
                lock_time: '2099-10-15T14:30+0000',
                etag: 'etag1',
            }

            return store.test(done, assignmentNotifications.onAssignmentLocked({}, payload))
            .then(() => {
                expect(store.dispatch.callCount).toBe(2)
                expect(assignmentsApi.fetchAssignmentById.callCount).toBe(1)
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
                }])
                done()
            })
        })

        it('calls UNLOCK_ASSIGNMENT action', (done) => {
            let payload = {
                item: 'as1',
                etag: 'etag1',
            }

            return store.test(done, assignmentNotifications.onAssignmentUnlocked({}, payload))
            .then(() => {
                expect(store.dispatch.callCount).toBe(2)
                expect(assignmentsApi.fetchAssignmentById.callCount).toBe(1)
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
                }])
                done()
            })
        })
    })

    describe('`assignment:completed`', () => {
        afterEach(() => {
            restoreSinonStub(assignmentsUi.reloadAssignments)
        })

        it('update planning on assignment complete', (done) => {
            store.initialState.workspace.currentDeskId = 'desk1'
            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                assignment_state: 'completed',
                coverage: 'c1',
                planning: 'p1',
                original_assigned_desk: 'desk1',
            }
            const plans = selectors.getStoredPlannings(store.getState())
            const planning1 = plans[payload.planning]
            const coverage1 = planning1.coverages.find((cov) =>
                cov.coverage_id === payload.coverage)

            expect(coverage1.assigned_to.desk).toBe('desk1')
            expect(coverage1.assigned_to.state).toBe(undefined)
            sinon.stub(assignmentsUi, 'reloadAssignments').callsFake(() => Promise.resolve())

            return store.test(done, assignmentNotifications.onAssignmentUpdated({}, payload))
            .then(() => {
                expect(coverage1.assigned_to.desk).toBe('desk2')
                expect(coverage1.assigned_to.state).toBe('completed')
                expect(assignmentsUi.reloadAssignments.callCount).toBe(1)
                done()
            })
        })

        it('unlocks assignment on assignment complete', (done) => {
            restoreSinonStub(assignmentsUi.fetchAssignmentById)
            sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(() => (
                Promise.resolve(store.initialState.assignment.assignments.as1)))

            store.initialState.locks.assignments = { as1: { user: 'ident1' } }
            store.initialState.workspace.currentDeskId = 'desk1'
            let payload = {
                item: 'as1',
                assigned_desk: 'desk2',
                assignment_state: 'completed',
                coverage: 'c1',
                planning: 'p1',
            }
            const plans = selectors.getStoredPlannings(store.getState())
            const planning1 = plans[payload.planning]
            const coverage1 = planning1.coverages.find((cov) =>
                cov.coverage_id === payload.coverage)

            expect(coverage1.assigned_to.desk).toBe('desk1')
            expect(coverage1.assigned_to.state).toBe(undefined)
            sinon.stub(assignmentsUi, 'fetch').callsFake(() => Promise.resolve())

            return store.test(done, assignmentNotifications.onAssignmentUpdated({}, payload))
            .then(() => {
                expect(coverage1.assigned_to.desk).toBe('desk2')
                expect(coverage1.assigned_to.state).toBe('completed')
                expect(store.dispatch.callCount).toBe(3)
                expect(assignmentsApi.fetchAssignmentById.callCount).toBe(1)
                expect(store.dispatch.args[2]).toEqual([{
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
                }])
                done()
            })
        })
    })
})
