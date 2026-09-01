import {cloneDeep} from 'lodash';

import {lockUtils} from '../index';
import * as testData from '../testData';

describe('utils.locks', () => {
    let lockedItems;

    beforeEach(() => {
        lockedItems = cloneDeep(testData.locks);
    });

    describe('getLock', () => {
        it('returns null if item is null', () => {
            expect(lockUtils.getLock(null, lockedItems)).toBe(null);
            expect(lockUtils.getLock({}, lockedItems)).toBe(null);
            expect(lockUtils.getLock({type: 'test'}, lockedItems)).toBe(null);
        });

        it('returns event locks', () => {
            let item = cloneDeep(testData.events[0]);

            // Event not locked
            expect(lockUtils.getLock(item, lockedItems)).toBe(null);

            // Single Event locked
            lockedItems.event[item._id] = item;
            expect(lockUtils.getLock(item, lockedItems)).toEqual(item);

            // Recurring Event locked
            item.recurrence_id = 'rec1';
            lockedItems.recurring.rec1 = item;
            expect(lockUtils.getLock(item, lockedItems)).toEqual(item);
        });

        it('returns planning locks', () => {
            let item = cloneDeep(testData.plannings[0]);

            // Planning not locked
            expect(lockUtils.getLock(item, lockedItems)).toBe(null);

            // Planning locked
            lockedItems.planning[item._id] = item;
            expect(lockUtils.getLock(item, lockedItems)).toEqual(item);

            // Associated Single Event locked
            item = cloneDeep(testData.plannings[1]);
            lockedItems.event[testData.events[0]._id] = testData.events[0];

            lockedItems.planning[item._id] = item;
            expect(lockUtils.getLock(item, lockedItems)).toEqual(item);

            // Associated Recurring Event locked
            item.recurrence_id = 'rec1';
            lockedItems.recurring.rec1 = item;
            expect(lockUtils.getLock(item, lockedItems)).toEqual(item);
        });

        it('returns planning locks stored under the primary related event', () => {
            // The `planning_locks` endpoint stores the lock of an event linked
            // planning under the event bucket only, with `item_id` pointing
            // back at the planning item
            const item = cloneDeep(testData.plannings[1]);
            const lock = {
                item_id: item._id,
                item_type: 'planning',
                action: 'edit',
                user: 'ident1',
                session: 'session1',
            };

            lockedItems.event[testData.events[0]._id] = lock;
            expect(lockUtils.getLock(item, lockedItems)).toEqual(lock);

            // A lock on the event itself does not count as this planning's lock
            lockedItems.event[testData.events[0]._id] = {...lock, item_id: testData.events[0]._id};
            expect(lockUtils.getLock(item, lockedItems)).toBe(null);
        });

        it('detects chain locks held by an associated item', () => {
            const planning = cloneDeep(testData.plannings[1]);
            const event = cloneDeep(testData.events[0]);
            const lockByEvent = {item_id: event._id, item_type: 'event', action: 'edit'};
            const lockByPlanning = {item_id: planning._id, item_type: 'planning', action: 'edit'};

            // Nothing locked
            expect(lockUtils.isItemLockedByAssociatedItem(planning, lockedItems)).toBe(false);
            expect(lockUtils.isItemLockedByAssociatedItem(event, lockedItems)).toBe(false);

            // The event holds the chain lock: the planning is blocked, the event is not
            lockedItems.event[event._id] = lockByEvent;
            expect(lockUtils.isItemLockedByAssociatedItem(planning, lockedItems)).toBe(true);
            expect(lockUtils.isItemLockedByAssociatedItem(event, lockedItems)).toBe(false);

            // The planning holds the chain lock: the event is blocked, the planning is not
            lockedItems.event[event._id] = lockByPlanning;
            expect(lockUtils.isItemLockedByAssociatedItem(planning, lockedItems)).toBe(false);
            expect(lockUtils.isItemLockedByAssociatedItem(event, lockedItems)).toBe(true);
        });

        it('returns assignment locks', () => {
            let item = cloneDeep(testData.assignments[0]);

            // Assignment not locked
            expect(lockUtils.getLock(item, lockedItems)).toBe(null);

            // Assignment locked
            lockedItems.assignment[item._id] = item;
            expect(lockUtils.getLock(item, lockedItems)).toBe(item);
        });
    });

    it('getLockedUser', () => {
        let item = cloneDeep(testData.events[0]);

        lockedItems.event[item._id] = {
            user: testData.users[0]._id,
            session: testData.sessions[0]._id,
        };

        // Returns null if lock not found
        expect(lockUtils.getLockedUser({}, lockedItems, testData.users)).toBe(null);

        // Returns null if user list is empty
        expect(lockUtils.getLockedUser(item, lockedItems, null)).toBe(null);
        expect(lockUtils.getLockedUser(item, lockedItems, {})).toBe(null);
        expect(lockUtils.getLockedUser(item, lockedItems, [])).toBe(null);

        // Returns the user for the lock
        expect(lockUtils.getLockedUser(item, lockedItems, testData.users)).toEqual(testData.users[0]);

        // Returns null if the user was not found
        lockedItems.event[item._id].user = 'ident3';
        expect(lockUtils.getLockedUser(item, lockedItems, testData.users)).toBe(null);
    });

    it('isItemLockedInThisSession', () => {
        const expectItemLock = (result, lockedItem, currentSession) => (
            expect(lockUtils.isItemLockedInThisSession(lockedItem, currentSession, lockedItems)).toBe(result)
        );

        let item = {
            _id: 'e1',
            type: 'event',
            lock_user: 'ident1',
            lock_session: 'session1',
            lock_action: 'edit',
            lock_time: '2099-10-15T14:30+0000',
        };

        let session = {
            identity: {_id: 'ident1'},
            sessionId: 'session1',
        };

        lockedItems.event.e1 = {
            item_id: 'e1',
            item_type: 'event',
            user: 'ident1',
            session: 'session1',
            action: 'edit',
            time: '2099-10-15T14:30+0000',
        };

        // Test item locked in this session
        expectItemLock(true, item, session);

        // Test item not locked in this session
        lockedItems.event.e1.session = 'session2';
        expectItemLock(false, {...item, lock_session: 'session2'}, session);
        lockedItems.event.e1.user = 'ident2';
        lockedItems.event.e1.session = 'session1';
        expectItemLock(false, {...item, lock_user: 'ident2'}, session);
        lockedItems.event.e1.user = 'ident1';
        expectItemLock(false, item, {...session, identity: {_id: 'ident2'}});
        expectItemLock(false, item, {...session, sessionId: 'session2'});

        // Test values not defined
        delete lockedItems.event.e1;
        expectItemLock(false, {...item, lock_user: null}, session);
        expectItemLock(false, {...item, lock_session: null}, session);
        expectItemLock(false, item, {...session, identity: {_id: null}});
        expectItemLock(false, item, {...session, sessionId: null});
        expectItemLock(false, {}, session);
        expectItemLock(false, item, {});
    });
});
