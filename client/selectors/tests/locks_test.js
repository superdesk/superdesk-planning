import {cloneDeep} from 'lodash';

import {locks} from '../';
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
                lock_time: '2029-01-16T02:40:00+0000'
            },
            e2: {
                _id: 'e2',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[1].sessionId,
                lock_time: '2029-01-16T02:52:00+0000'
            },
            e3: {
                _id: 'e3',
                lock_user: users[0]._id,
                lock_action: 'cancel',
                lock_session: sessions[0].sessionId
            },
            e4: {
                _id: 'e4',
                lock_user: users[1]._id,
                lock_action: 'edit',
                lock_session: sessions[0].sessionId
            },
            e5: {
                _id: 'e5',
                lock_user: users[1]._id,
                lock_action: 'cancel',
                lock_session: sessions[0].sessionId
            },
            e6: {
                _id: 'e6',
                lock_user: users[0]._id,
                lock_action: 'edit'
            },
            e7: {
                _id: 'e7',
                lock_action: 'edit',
                lock_session: sessions[0].sessionId
            },
            e8: {
                _id: 'e8',
                lock_user: users[0]._id,
                lock_session: sessions[0].sessionId
            },
            e9: {_id: 'e9'},
        };

        lockedPlannings = {
            p1: {
                _id: 'p1',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[0].sessionId,
                lock_time: '2029-01-16T02:41:00+0000'
            },
            p2: {
                _id: 'p2',
                lock_user: users[0]._id,
                lock_action: 'edit',
                lock_session: sessions[1].sessionId,
                lock_time: '2029-01-16T02:40:44+0000'
            },
            p3: {
                _id: 'p3',
                lock_user: users[0]._id,
                lock_action: 'cancel',
                lock_session: sessions[0].sessionId
            },
            p4: {
                _id: 'p4',
                lock_user: users[1]._id,
                lock_action: 'edit',
                lock_session: sessions[0].sessionId
            },
            p5: {
                _id: 'p5',
                lock_user: users[1]._id,
                lock_action: 'cancel',
                lock_session: sessions[0].sessionId
            },
            p6: {
                _id: 'p6',
                lock_user: users[0]._id,
                lock_action: 'edit'
            },
            p7: {
                _id: 'p7',
                lock_action: 'edit',
                lock_session: sessions[0].sessionId
            },
            p8: {
                _id: 'p8',
                lock_user: users[0]._id,
                lock_session: sessions[0].sessionId
            },
            p9: {_id: 'p9'},
        };

        state.planning.plannings = lockedPlannings;
        state.events.events = lockedEvents;
    });

    it('getLockedPlannings returns only the locked planning items for the current user', () => {
        expect(locks.getLockedPlannings(state)).toEqual([
            lockedPlannings.p1,
            lockedPlannings.p2,
        ]);
    });

    it('getLockedEvents returns only the locked event items for the current user', () => {
        expect(locks.getLockedEvents(state)).toEqual([
            lockedEvents.e1,
            lockedEvents.e2,
        ]);
    });

    it('workqueueItems gets the list of events and planning items locked by the current user', () => {
        // Ensure that the returned items are sorted by the lock_time
        expect(locks.workqueueItems(state)).toEqual([
            lockedEvents.e1, //    2029-01-16T02:40:00
            lockedPlannings.p2, // 2029-01-16T02:40:44
            lockedPlannings.p1, // 2029-01-16T02:41:00
            lockedEvents.e2, //    2029-01-16T02:52:00
        ]);
    });
});
