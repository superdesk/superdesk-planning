import eventUtils from '../events';
import moment from 'moment';
import lockReducer from '../../reducers/locks';
import {EVENTS} from '../../constants';
import {expectActions} from '../testUtils';

describe('EventUtils', () => {
    let session;
    let locks;
    let lockedItems;

    beforeEach(() => {
        session = {
            identity: {_id: 'ident1'},
            sessionId: 'session1',
        };

        locks = {
            events: {
                standalone: {
                    currentUser: {
                        currentSession: {
                            _id: 'e1',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                        otherSession: {
                            _id: 'e2',
                            lock_user: 'ident1',
                            lock_session: 'session2',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                    },
                    otherUser: {
                        _id: 'e3',
                        lock_user: 'ident2',
                        lock_session: 'session3',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                    notLocked: {_id: 'e4'},
                },
                recurring: {
                    currentUser: {
                        currentSession: {
                            _id: 'e5',
                            recurrence_id: 'r1',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                        otherSession: {
                            _id: 'e6',
                            recurrence_id: 'r2',
                            lock_user: 'ident1',
                            lock_session: 'session2',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                    },
                    otherUser: {
                        _id: 'e7',
                        recurrence_id: 'r3',
                        lock_user: 'ident2',
                        lock_session: 'session3',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                    notLocked: {
                        _id: 'e8',
                        recurrence_id: 'r4',
                    },
                },
                associated: {
                    standalone: {
                        _id: 'e9',
                        planning_ids: ['p1'],
                    },
                    recurring: {
                        direct: {
                            _id: 'e10',
                            recurrence_id: 'r5',
                            planning_ids: ['p2'],
                        },
                        indirect: {
                            _id: 'e11',
                            recurrence_id: 'r6',
                        },
                    },
                },
            },
            plans: {
                standalone: {
                    _id: 'p1',
                    event_item: 'e9',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                    lock_action: 'edit',
                    lock_time: '2099-10-15T14:30+0000',
                },
                recurring: {
                    direct: {
                        _id: 'p2',
                        event_item: 'e10',
                        recurrence_id: 'r5',
                        lock_user: 'ident1',
                        lock_session: 'session1',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                    indirect: {
                        _id: 'p3',
                        event_item: 'e12',
                        recurrence_id: 'r6',
                        lock_user: 'ident1',
                        lock_session: 'session1',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                },
            },
        };

        lockedItems = lockReducer({}, {
            type: 'RECEIVE_LOCKS',
            payload: {
                events: [
                    locks.events.standalone.currentUser.currentSession,
                    locks.events.standalone.currentUser.otherSession,
                    locks.events.standalone.otherUser,
                    locks.events.recurring.currentUser.currentSession,
                    locks.events.recurring.currentUser.otherSession,
                    locks.events.recurring.otherUser,
                ],
                plans: [
                    locks.plans.standalone,
                    locks.plans.recurring.direct,
                    locks.plans.recurring.indirect,
                ],
            },
        });
    });

    describe('doesRecurringEventsOverlap', () => {
        it('returns true on daily', () => {
            const start = moment('2029-10-15T00:00:00');
            const end = moment('2029-10-16T00:05:00');
            const rule = {
                frequency: 'DAILY',
                interval: 1,
            };

            expect(eventUtils.doesRecurringEventsOverlap(start, end, rule)).toBe(true);
        });

        it('returns false on daily', () => {
            const start = moment('2029-10-15T00:00:00');
            const end = moment('2029-10-15T23:59:00');
            const rule = {
                frequency: 'DAILY',
                interval: 1,
            };

            expect(eventUtils.doesRecurringEventsOverlap(start, end, rule)).toBe(false);
        });

        it('returns true on weekly', () => {
            const start = moment('2029-10-15T00:00:00');
            const end = moment('2029-10-16T00:05:00');
            const rule = {
                frequency: 'WEEKLY',
                interval: 1,
                byday: 'MO TU WE TH FR SA SU',
            };

            expect(eventUtils.doesRecurringEventsOverlap(start, end, rule)).toBe(true);
        });
    });

    it('eventHasPlanning', () => {
        const events = {
            e1: {planning_ids: ['p1']},
            e2: {planning_ids: []},
            e3: {},
        };

        expect(eventUtils.eventHasPlanning(events.e1)).toBe(true);
        expect(eventUtils.eventHasPlanning(events.e2)).toBe(false);
        expect(eventUtils.eventHasPlanning(events.e3)).toBe(false);
    });

    const isEventLocked = (event, result) => (
        expect(eventUtils.isEventLocked(event, lockedItems)).toBe(result)
    );
    const isEventLockRestricted = (event, result) => (
        expect(eventUtils.isEventLockRestricted(event, session, lockedItems)).toBe(result)
    );

    it('isEventLocked', () => {
        // Null item
        isEventLocked(null, false);

        // Standalone Events
        isEventLocked(locks.events.standalone.currentUser.currentSession, true);
        isEventLocked(locks.events.standalone.currentUser.otherSession, true);
        isEventLocked(locks.events.standalone.otherUser, true);
        isEventLocked(locks.events.standalone.notLocked, false);

        // Recurring Events
        isEventLocked(locks.events.recurring.currentUser.currentSession, true);
        isEventLocked(locks.events.recurring.currentUser.otherSession, true);
        isEventLocked(locks.events.recurring.otherUser, true);
        isEventLocked(locks.events.recurring.notLocked, false);

        // Events with locks on the Planning item
        isEventLocked(locks.events.associated.standalone, true);
        isEventLocked(locks.events.associated.recurring.direct, true);
        isEventLocked(locks.events.associated.recurring.indirect, true);
    });

    it('isEventLockRestricted', () => {
        // Null item
        isEventLockRestricted(null, false);

        // Standalone Events
        isEventLockRestricted(locks.events.standalone.currentUser.currentSession, false);
        isEventLockRestricted(locks.events.standalone.currentUser.otherSession, true);
        isEventLockRestricted(locks.events.standalone.otherUser, true);
        isEventLockRestricted(locks.events.standalone.notLocked, false);

        // Recurring Events
        isEventLockRestricted(locks.events.recurring.currentUser.currentSession, false);
        isEventLockRestricted(locks.events.recurring.currentUser.otherSession, true);
        isEventLockRestricted(locks.events.recurring.otherUser, true);
        isEventLockRestricted(locks.events.recurring.notLocked, false);
    });

    describe('getEventItemActions', () => {
        const actions = [
            EVENTS.ITEM_ACTIONS.SPIKE,
            EVENTS.ITEM_ACTIONS.UNSPIKE,
            EVENTS.ITEM_ACTIONS.DUPLICATE,
            EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
            EVENTS.ITEM_ACTIONS.UPDATE_TIME,
            EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
            EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
            EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
            EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
        ];

        let locks;
        let session;
        let event;
        let privileges;

        beforeEach(() => {
            session = {};
            locks = {
                event: {},
                planning: {},
                recurring: {},
            };
            event = {
                state: 'draft',
                planning_ids: [],
            };
            privileges = {
                planning_planning_management: 1,
                planning_event_management: 1,
                planning_event_spike: 1,
            };
        });

        it('draft event with no planning items (not in use)', () => {
            const itemActions = eventUtils.getEventItemActions(
                event, session, privileges, actions, locks
            );

            expectActions(itemActions, [
                'Spike',
                'Duplicate',
                'Cancel',
                'Update time',
                'Reschedule',
                'Mark as Postponed',
                'Convert to recurring event',
                'Create Planning Item',
            ]);
        });

        it('postponed event', () => {
            event.state = 'postponed';
            let itemActions = eventUtils.getEventItemActions(
                event, session, privileges, actions, locks
            );

            expectActions(itemActions, [
                'Spike',
                'Duplicate',
                'Cancel',
                'Reschedule',
            ]);

            event.planning_ids = ['1']; // Event in use
            itemActions = eventUtils.getEventItemActions(
                event, session, privileges, actions, locks
            );

            expectActions(itemActions, [
                'Duplicate',
                'Cancel',
                'Reschedule',
            ]);
        });
    });
});
