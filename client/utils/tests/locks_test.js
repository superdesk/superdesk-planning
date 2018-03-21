import {cloneDeep} from 'lodash';
import sinon from 'sinon';

import {restoreSinonStub} from '../testUtils';
import {eventUtils, planningUtils, lockUtils} from '../index';
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
            expect(lockUtils.getLock(item, lockedItems)).toEqual(testData.events[0]);

            // Associated Recurring Event locked
            item.recurrence_id = 'rec1';
            lockedItems.recurring.rec1 = item;
            expect(lockUtils.getLock(item, lockedItems)).toEqual(item);
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
            expect(lockUtils.isItemLockedInThisSession(lockedItem, currentSession)).toBe(result)
        );

        let item = {
            lock_user: 'ident1',
            lock_session: 'session1'
        };

        let session = {
            identity: {_id: 'ident1'},
            sessionId: 'session1'
        };

        // Test item locked in this session
        expectItemLock(true, item, session);

        // Test item not locked in this session
        expectItemLock(false, {...item, lock_session: 'session2'}, session);
        expectItemLock(false, {...item, lock_user: 'ident2'}, session);
        expectItemLock(false, item, {...session, identity: {_id: 'ident2'}});
        expectItemLock(false, item, {...session, sessionId: 'session2'});

        // Test values not defined
        expectItemLock(false, {...item, lock_user: null}, session);
        expectItemLock(false, {...item, lock_session: null}, session);
        expectItemLock(false, item, {...session, identity: {_id: null}});
        expectItemLock(false, item, {...session, sessionId: null});
        expectItemLock(false, {}, session);
        expectItemLock(false, item, {});
    });

    describe('isLockRestricted', () => {
        beforeEach(() => {
            sinon.stub(eventUtils, 'isEventLockRestricted').returns(true);
            sinon.stub(planningUtils, 'isPlanningLockRestricted').returns(true);
        });

        afterEach(() => {
            restoreSinonStub(eventUtils.isEventLockRestricted);
            restoreSinonStub(planningUtils.isPlanningLockRestricted);
        });

        it('tests event and planning lock restriction', () => {
            expect(lockUtils.isLockRestricted({type: 'event'}, testData.sessions[0], testData.locks)).toBe(true);
            expect(eventUtils.isEventLockRestricted.callCount).toBe(1);
            expect(eventUtils.isEventLockRestricted.args[0]).toEqual([
                {type: 'event'},
                testData.sessions[0],
                testData.locks
            ]);

            expect(lockUtils.isLockRestricted({type: 'planning'}, testData.sessions[0], testData.locks)).toBe(true);
            expect(planningUtils.isPlanningLockRestricted.callCount).toBe(1);
            expect(planningUtils.isPlanningLockRestricted.args[0]).toEqual([
                {type: 'planning'},
                testData.sessions[0],
                testData.locks
            ]);

            expect(lockUtils.isLockRestricted({}, testData.sessions[0], testData.locks)).toBe(false);
        });
    });
});
