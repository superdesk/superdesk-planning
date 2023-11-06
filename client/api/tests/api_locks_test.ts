import sinon from 'sinon';
import {Store} from 'redux';
import {cloneDeep} from 'lodash';

import {superdeskApi, planningApi} from '../../superdeskApi';
import {IPlanningAppState} from '../../interfaces';
import {EVENTS, PLANNING, ASSIGNMENTS} from '../../constants';

import * as testDataOriginal from '../../utils/testData';
import {restoreSinonStub} from '../../utils/testUtils';
import {createTestStore} from '../../utils';
import * as selectors from '../../selectors';

const testData = cloneDeep(testDataOriginal);

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

    it('store locks are managed through setItemAsLocked and setItemAsUnlocked functions', () => {
        const itemLock = {
            item: testData.events[0]._id,
            type: testData.events[0].type,
            event_item: undefined,
            etag: testData.events[0]._etag,
            user: testData.lockedEvents[0].lock_user,
            lock_session: testData.lockedEvents[0].lock_session,
        };

        expect(selectors.locks.getLockedItems(redux.getState())).toEqual({
            event: {},
            planning: {},
            assignment: {},
            recurring: {},
        });
        planningApi.locks.setItemAsLocked({
            ...itemLock,
            lock_action: testData.lockedEvents[0].lock_action,
            lock_time: testData.lockedEvents[0].lock_time,
            recurrence_id: undefined,
        });
        expect(selectors.locks.getLockedItems(redux.getState())).toEqual({
            event: {[testData.events[0]._id]: testData.eventLocks.e1},
            planning: {},
            assignment: {},
            recurring: {},
        });
        planningApi.locks.setItemAsUnlocked({
            ...itemLock,
            from_ingest: false,
        });
        expect(selectors.locks.getLockedItems(redux.getState())).toEqual({
            event: {},
            planning: {},
            assignment: {},
            recurring: {},
        });
    });

    it('lockItemById attempts to load the item by id before locking it', (done) => {
        superdeskApi.dataApi.findOne = sinon.stub().callsFake(() => Promise.resolve(testData.events[0]));
        sinon.stub(planningApi.locks, 'lockItem').callsFake((e) => e);

        planningApi.locks.lockItemById(testData.events[0]._id, testData.events[0].type, 'cancel').then((lockedItem) => {
            expect(lockedItem).toEqual(testData.events[0]);
            expect(planningApi.locks.lockItem.callCount).toBe(1);
            expect(planningApi.locks.lockItem.args[0]).toEqual([testData.events[0], 'cancel']);
            done();
        })
            .finally(() => {
                restoreSinonStub(planningApi.locks.lockItem);
            });
    });

    describe('locking items', () => {
        let mock_api_lock_unlock_data;
        let state: IPlanningAppState;

        beforeEach(() => {
            superdeskApi.dataApi.create = sinon.stub().callsFake((resource: string, updates) => {
                if (resource.endsWith('/lock')) {
                    return Promise.resolve({
                        ...mock_api_lock_unlock_data,
                        ...updates,
                    });
                } else if (resource.endsWith('/unlock')) {
                    return Promise.resolve({
                        ...mock_api_lock_unlock_data,
                        ...updates,
                        lock_action: null,
                        lock_user: null,
                        lock_session: null,
                        lock_time: null,
                    });
                }

                return updates;
            });

            superdeskApi.dataApi.queryRawJson = sinon.stub().callsFake((resource: string) => {
                if (resource.startsWith('events_planning_search')) {
                    return Promise.resolve({
                        _items: [testData.lockedEvents[0]],
                        _links: {},
                        _meta: {total: 1},
                    });
                } else if (resource.startsWith('planning_locks')) {
                    const lockedEvent = testData.lockedEvents[0];

                    return Promise.resolve({
                        assignment: {},
                        event: {
                            [lockedEvent._id]: {
                                item_id: lockedEvent._id,
                                item_type: lockedEvent.type,
                                user: lockedEvent.lock_user,
                                session: lockedEvent.lock_session,
                                action: lockedEvent.lock_action,
                                time: lockedEvent.lock_time,
                            },
                        },
                        planning: {},
                        recurring: {},
                    });
                }

                return Promise.resolve({
                    _items: [],
                    _links: {},
                    _meta: {total: 0},
                });
            });
        });

        it('can lock/unlock an Event', (done) => {
            mock_api_lock_unlock_data = testData.lockedEvents[0];
            state = redux.getState();

            expect(selectors.locks.getLockedItems(state).event.e1).toBeUndefined();

            planningApi.locks.lockItem(testData.events[0], 'edit')
                .then((lockedItem) => {
                    // `dataApi` was called with the correct URL and params
                    expect(superdeskApi.dataApi.create.callCount).toBe(1);
                    expect(superdeskApi.dataApi.create.args[0]).toEqual([
                        'events/e1/lock',
                        {lock_action: 'edit'},
                    ]);

                    // Lock is added to the store
                    state = redux.getState();
                    expect(selectors.locks.getLockedItems(state).event.e1).toEqual(testData.eventLocks.e1);

                    // Item specific dispatches
                    expect(redux.dispatch.callCount).toBe(2);
                    expect(redux.dispatch.args[1]).toEqual([{
                        type: EVENTS.ACTIONS.LOCK_EVENT,
                        payload: {event: lockedItem},
                    }]);

                    return planningApi.locks.unlockItem(testData.events[0]);
                })
                .then(() => {
                    // Lock is removed from the store
                    state = redux.getState();
                    expect(selectors.locks.getLockedItems(state).event.e1).toBeUndefined();

                    // Item specific dispatches
                    expect(redux.dispatch.callCount).toBe(4);
                    expect(redux.dispatch.args[3]).toEqual([{
                        type: EVENTS.ACTIONS.UNLOCK_EVENT,
                        payload: {
                            event: jasmine.objectContaining({
                                _id: testData.lockedEvents[0]._id,
                                lock_action: null,
                                lock_user: null,
                                lock_session: null,
                                lock_time: null,
                            }),
                        },
                    }]);

                    done();
                });
        });

        it('can lock/unlock a Planning item', (done) => {
            mock_api_lock_unlock_data = testData.lockedPlannings[0];
            state = redux.getState();

            expect(selectors.locks.getLockedItems(state).planning.p1).toBeUndefined();

            planningApi.locks.lockItem(testData.plannings[0], 'cancel')
                .then((lockedItem) => {
                    // `dataApi` was called with the correct URL and params
                    expect(superdeskApi.dataApi.create.callCount).toBe(1);
                    expect(superdeskApi.dataApi.create.args[0]).toEqual([
                        'planning/p1/lock',
                        {lock_action: 'cancel'},
                    ]);

                    // Lock is added to the store
                    state = redux.getState();
                    expect(selectors.locks.getLockedItems(state).planning.p1).toEqual({
                        ...testData.planningLocks.p1,
                        action: 'cancel',
                    });

                    // Item specific dispatches
                    expect(redux.dispatch.callCount).toBe(2);
                    expect(redux.dispatch.args[1]).toEqual([{
                        type: PLANNING.ACTIONS.LOCK_PLANNING,
                        payload: {plan: lockedItem},
                    }]);

                    return planningApi.locks.unlockItem(testData.plannings[0]);
                })
                .then(() => {
                    // Lock is removed from the store
                    state = redux.getState();
                    expect(selectors.locks.getLockedItems(state).planning.p1).toBeUndefined();

                    // Item specific dispatches
                    expect(redux.dispatch.callCount).toBe(4);
                    expect(redux.dispatch.args[3]).toEqual([{
                        type: PLANNING.ACTIONS.UNLOCK_PLANNING,
                        payload: {
                            plan: jasmine.objectContaining({
                                _id: testData.lockedPlannings[0]._id,
                                lock_action: null,
                                lock_user: null,
                                lock_session: null,
                                lock_time: null,
                            }),
                        },
                    }]);

                    done();
                });
        });

        it('can lock/unlock an Assignment', (done) => {
            mock_api_lock_unlock_data = testData.lockedAssignments[0];
            state = redux.getState();

            expect(selectors.locks.getLockedItems(state).assignment.as1).toBeUndefined();

            planningApi.locks.lockItem(testData.assignments[0], 'reassign')
                .then((lockedItem) => {
                    // `dataApi` was called with the correct URL and params
                    expect(superdeskApi.dataApi.create.callCount).toBe(1);
                    expect(superdeskApi.dataApi.create.args[0]).toEqual([
                        'assignments/as1/lock',
                        {lock_action: 'reassign'},
                    ]);

                    // Lock is added to the store
                    state = redux.getState();
                    expect(selectors.locks.getLockedItems(state).assignment.as1).toEqual({
                        ...testData.assignmentLocks.as1,
                        action: 'reassign',
                    });

                    // Item specific dispatches
                    expect(redux.dispatch.callCount).toBe(2);
                    expect(redux.dispatch.args[1]).toEqual([{
                        type: ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT,
                        payload: {assignment: lockedItem},
                    }]);

                    return planningApi.locks.unlockItem(testData.assignments[0]);
                })
                .then(() => {
                    // Lock is removed from the store
                    state = redux.getState();
                    expect(selectors.locks.getLockedItems(state).assignment.as1).toBeUndefined();

                    done();
                });
        });
    });
});
