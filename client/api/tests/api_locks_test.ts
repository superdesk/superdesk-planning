import sinon from 'sinon';
import {Store} from 'redux';

import {superdeskApi, planningApi} from '../../superdeskApi';
import {EVENTS, PLANNING, ASSIGNMENTS} from '../../constants';
import * as testData from '../../utils/testData';
import {restoreSinonStub} from '../../utils/testUtils';
import {createTestStore} from '../../utils';

describe('planningApi.locks', () => {
    let redux: Store;

    beforeEach(() => {
        redux = createTestStore();
        planningApi.redux.store = redux;
        sinon.stub(planningApi.redux.store, 'dispatch').callThrough();
    });
    afterEach(() => {
        restoreSinonStub(planningApi.redux.store.dispatch);
    });

    describe('locking items', () => {
        beforeEach(() => {
            sinon.stub(planningApi.locks, 'addLockToStore').returns(undefined);
        });
        afterEach(() => {
            restoreSinonStub(planningApi.locks.addLockToStore);
        });

        it('can lock an Event', (done) => {
            superdeskApi.dataApi.create = sinon.stub().callsFake((_resource, updates) => Promise.resolve({
                ...testData.lockedEvents[0],
                ...updates,
            }));

            planningApi.locks.lockItem(testData.events[0], 'edit').then((lockedItem) => {
                // `dataApi` was called with the correct URL and params
                expect(superdeskApi.dataApi.create.callCount).toBe(1);
                expect(superdeskApi.dataApi.create.args[0]).toEqual([
                    'events/e1/lock',
                    {lock_action: 'edit'},
                ]);

                // Lock is added to the store
                expect(planningApi.locks.addLockToStore.callCount).toBe(1);
                expect(planningApi.locks.addLockToStore.args[0]).toEqual([{
                    item: lockedItem._id,
                    type: lockedItem.type,
                    event_item: undefined,
                    recurrence_id: undefined,
                    etag: lockedItem._etag,
                    user: lockedItem.lock_user,
                    lock_session: lockedItem.lock_session,
                    lock_action: lockedItem.lock_action,
                    lock_time: lockedItem.lock_time,
                }]);

                // Item specific dispatches
                expect(redux.dispatch.callCount).toBe(1);
                expect(redux.dispatch.args[0]).toEqual([{
                    type: EVENTS.ACTIONS.LOCK_EVENT,
                    payload: {event: lockedItem},
                }]);

                done();
            });
        });

        it('can lock a Planning item', (done) => {
            superdeskApi.dataApi.create = sinon.stub().callsFake((_resource, updates) => Promise.resolve({
                ...testData.lockedPlannings[0],
                ...updates,
            }));

            planningApi.locks.lockItem(testData.plannings[0], 'cancel').then((lockedItem) => {
                // `dataApi` was called with the correct URL and params
                expect(superdeskApi.dataApi.create.callCount).toBe(1);
                expect(superdeskApi.dataApi.create.args[0]).toEqual([
                    'planning/p1/lock',
                    {lock_action: 'cancel'},
                ]);

                // Lock is added to the store
                expect(planningApi.locks.addLockToStore.callCount).toBe(1);
                expect(planningApi.locks.addLockToStore.args[0]).toEqual([{
                    item: lockedItem._id,
                    type: lockedItem.type,
                    event_item: undefined,
                    recurrence_id: undefined,
                    etag: lockedItem._etag,
                    user: lockedItem.lock_user,
                    lock_session: lockedItem.lock_session,
                    lock_action: lockedItem.lock_action,
                    lock_time: lockedItem.lock_time,
                }]);

                // Item specific dispatches
                expect(redux.dispatch.callCount).toBe(1);
                expect(redux.dispatch.args[0]).toEqual([{
                    type: PLANNING.ACTIONS.LOCK_PLANNING,
                    payload: {plan: lockedItem},
                }]);

                done();
            });
        });

        it('can lock an Assignment', (done) => {
            superdeskApi.dataApi.create = sinon.stub().callsFake((_resource, updates) => Promise.resolve({
                ...testData.lockedAssignments[0],
                ...updates,
            }));

            planningApi.locks.lockItem(testData.assignments[0], 'reassign').then((lockedItem) => {
                // `dataApi` was called with the correct URL and params
                expect(superdeskApi.dataApi.create.callCount).toBe(1);
                expect(superdeskApi.dataApi.create.args[0]).toEqual([
                    'assignments/as1/lock',
                    {lock_action: 'reassign'},
                ]);

                // Lock is added to the store
                expect(planningApi.locks.addLockToStore.callCount).toBe(1);
                expect(planningApi.locks.addLockToStore.args[0]).toEqual([{
                    item: lockedItem._id,
                    type: lockedItem.type,
                    event_item: undefined,
                    recurrence_id: undefined,
                    etag: lockedItem._etag,
                    user: lockedItem.lock_user,
                    lock_session: lockedItem.lock_session,
                    lock_action: lockedItem.lock_action,
                    lock_time: lockedItem.lock_time,
                }]);

                // Item specific dispatches
                expect(redux.dispatch.callCount).toBe(1);
                expect(redux.dispatch.args[0]).toEqual([{
                    type: ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT,
                    payload: {assignment: lockedItem},
                }]);

                done();
            });
        });
    });
});
