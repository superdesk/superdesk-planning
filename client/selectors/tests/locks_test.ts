import {cloneDeep} from 'lodash';

import {locks} from '../';
import {lockUtils} from '../../utils';
import * as testData from '../../utils/testData';

describe('selectors.locks', () => {
    let state;
    let users;
    let sessions;

    let lockedEvents;
    let lockedPlannings;

    beforeEach(() => {
        state = cloneDeep(testData.initialState);
        users = testData.users;
        sessions = testData.sessions;

        lockedEvents = {
            e1: {
                _id: 'e1',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[0].sessionId,
                lock_time: '2029-01-16T02:40:00+0000',
            },
            e2: {
                _id: 'e2',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[1].sessionId,
                lock_time: '2029-01-16T02:52:00+0000',
            },
            e3: {
                _id: 'e3',
                lock_user: users[0]._id,
                lock_action: 'cancel',
                lock_session: sessions[0].sessionId,
            },
            e4: {
                _id: 'e4',
                lock_user: users[1]._id,
                lock_action: 'edit',
                lock_session: sessions[0].sessionId,
            },
            e5: {
                _id: 'e5',
                lock_user: users[1]._id,
                lock_action: 'cancel',
                lock_session: sessions[0].sessionId,
            },
            e6: {
                _id: 'e6',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[1].sessionId,
                lock_time: '2029-01-16T02:45:00+0000',
            },
            e7: {
                _id: 'e7',
                lock_action: 'edit',
                lock_session: sessions[0].sessionId,
            },
            e8: {
                _id: 'e8',
                lock_user: users[0]._id,
                lock_session: sessions[0].sessionId,
            },
            e9: {_id: 'e9'},
        };

        lockedPlannings = {
            p1: {
                _id: 'p1',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[0].sessionId,
                lock_time: '2029-01-16T02:41:00+0000',
            },
            p2: {
                _id: 'p2',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[1].sessionId,
                lock_time: '2029-01-16T02:40:44+0000',
            },
            p3: {
                _id: 'p3',
                lock_user: users[0]._id,
                lock_action: 'cancel',
                lock_session: sessions[0].sessionId,
            },
            p4: {
                _id: 'p4',
                lock_user: users[1]._id,
                lock_action: 'edit',
                lock_session: sessions[0].sessionId,
            },
            p5: {
                _id: 'p5',
                lock_user: users[1]._id,
                lock_action: 'cancel',
                lock_session: sessions[0].sessionId,
            },
            p6: {
                _id: 'p6',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[1].sessionId,
                lock_time: '2029-01-16T02:47:00+0000',
            },
            p7: {
                _id: 'p7',
                lock_action: 'edit',
                lock_session: sessions[0].sessionId,
            },
            p8: {
                _id: 'p8',
                lock_user: users[0]._id,
                lock_session: sessions[0].sessionId,
            },
            p9: {_id: 'p9'},
        };

        state.planning.plannings = lockedPlannings;
        state.events.events = lockedEvents;
        state.locks = {
            event: {
                e1: lockUtils.getLockFromItem(lockedEvents.e1),
                e2: lockUtils.getLockFromItem(lockedEvents.e2),
                e3: lockUtils.getLockFromItem(lockedEvents.e3),
                e4: lockUtils.getLockFromItem(lockedEvents.e4),
                e5: lockUtils.getLockFromItem(lockedEvents.e5),
                e6: lockUtils.getLockFromItem(lockedEvents.e6),
                e7: lockUtils.getLockFromItem(lockedEvents.e7),
                e8: lockUtils.getLockFromItem(lockedEvents.e8),
            },
            planning: {
                p1: lockUtils.getLockFromItem(lockedPlannings.p1),
                p2: lockUtils.getLockFromItem(lockedPlannings.p2),
                p3: lockUtils.getLockFromItem(lockedPlannings.p3),
                p4: lockUtils.getLockFromItem(lockedPlannings.p4),
                p5: lockUtils.getLockFromItem(lockedPlannings.p5),
                p6: lockUtils.getLockFromItem(lockedPlannings.p6),
                p7: lockUtils.getLockFromItem(lockedPlannings.p7),
                p8: lockUtils.getLockFromItem(lockedPlannings.p8),
            },
            recurring: {},
            assignment: {},
        };
    });

    it('getLockedPlannings returns only the locked planning items for the current user', () => {
        expect(locks.getLockedPlannings(state)).toEqual([
            lockedPlannings.p1,
            lockedPlannings.p2,
            lockedPlannings.p6,
        ]);
    });

    it('getLockedEvents returns only the locked event items for the current user', () => {
        expect(locks.getLockedEvents(state)).toEqual([
            lockedEvents.e1,
            lockedEvents.e2,
            lockedEvents.e6,
        ]);
    });

    it('workqueueItems gets the list of events and planning items locked by the current user', () => {
        // Ensure that the returned items are sorted by the lock_time
        expect(locks.workqueueItems(state)).toEqual([
            lockedEvents.e1, //    2029-01-16T02:40:00
            lockedPlannings.p2, // 2029-01-16T02:40:44
            lockedPlannings.p1, // 2029-01-16T02:41:00
            lockedEvents.e6, //    2029-01-16T02:45:00
            lockedPlannings.p6, // 2029-01-16T02:47:00
            lockedEvents.e2, //    2029-01-16T02:52:00
        ]);
    });
});
