import sinon from 'sinon';
import eventUtils from '../events';
import moment from 'moment';
import {cloneDeep, get} from 'lodash';
import lockReducer from '../../reducers/locks';
import {EVENTS, WORKFLOW_STATE, POST_STATE} from '../../constants';
import {expectActions, restoreSinonStub} from '../testUtils';

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

    it('canCreatePlanningFromEvent', () => {
        const privileges = {planning_planning_management: 1};

        expect(eventUtils.canCreatePlanningFromEvent({state: 'spiked'},
            session, privileges, lockedItems)).toBe(false);
        expect(eventUtils.canCreatePlanningFromEvent({state: 'draft'},
            session, privileges, lockedItems)).toBe(true);
        expect(eventUtils.canCreatePlanningFromEvent({state: 'cancelled'},
            session, privileges, lockedItems)).toBe(false);
        expect(eventUtils.canCreatePlanningFromEvent({state: 'rescheduled'},
            session, privileges, lockedItems)).toBe(false);
        expect(eventUtils.canCreatePlanningFromEvent({state: 'postponed'},
            session, privileges, lockedItems)).toBe(false);
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
        let actions;
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
                planning_event_post: 1,
                planning_edit_expired: 1,
            };

            actions = [
                EVENTS.ITEM_ACTIONS.SPIKE,
                EVENTS.ITEM_ACTIONS.UNSPIKE,
                EVENTS.ITEM_ACTIONS.DUPLICATE,
                EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
                EVENTS.ITEM_ACTIONS.UPDATE_TIME,
                EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
                EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
                EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
                EVENTS.ITEM_ACTIONS.CREATE_PLANNING,
                EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING,
                EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS,
                EVENTS.ITEM_ACTIONS.EDIT_EVENT,
                EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL,
                EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR,
            ];
        });

        const getActions = () => (
            eventUtils.getEventItemActions(
                event, session, privileges, actions, locks
            )
        );

        it('draft event with no planning items (not in use)', () => {
            expectActions(getActions(), [
                'Spike',
                'Duplicate',
                'Cancel',
                'Update time',
                'Reschedule',
                'Mark as Postponed',
                'Convert to Recurring Event',
                'Create Planning Item',
                'Create and Open Planning Item',
                'Edit',
                'Edit in popup',
                'Assign to calendar',
            ]);
        });

        it('postponed event', () => {
            event.state = 'postponed';
            expectActions(getActions(), [
                'Spike',
                'Duplicate',
                'Cancel',
                'Reschedule',
                'Edit',
                'Edit in popup',
                'Assign to calendar',
            ]);

            event.planning_ids = ['1']; // Event in use
            expectActions(getActions(), [
                'Spike',
                'Duplicate',
                'Cancel',
                'Reschedule',
                'Edit',
                'Edit in popup',
                'Assign to calendar',
            ]);
        });

        it('assign to calendar', () => {
            actions = [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR];

            // Event must be defined
            event = null;
            expectActions(getActions(), []);
            event = undefined;
            expectActions(getActions(), []);

            // Base condition where assign to calendar is available
            event = {
                _id: 'e1',
                state: WORKFLOW_STATE.DRAFT,
            };
            expectActions(getActions(), ['Assign to calendar']);

            // Must not be spiked
            event.state = WORKFLOW_STATE.SPIKED;
            expectActions(getActions(), []);
            event.state = WORKFLOW_STATE.DRAFT;

            // Event must not be locked
            locks.event.e1 = {};
            expectActions(getActions(), []);
            delete locks.event.e1;

            // Event series must not be locked
            locks.recurring.er1 = {};
            event.recurrence_id = 'er1';
            expectActions(getActions(), []);
            delete locks.recurring.er1;

            // Must have the privilege
            privileges.planning_event_management = 0;
            expectActions(getActions(), []);
            privileges.planning_event_management = 1;

            // If the item is posted, must have event_post privilege
            event.pubstatus = POST_STATE.USABLE;
            privileges.planning_event_post = 0;
            expectActions(getActions(), []);
            privileges.planning_event_post = 1;
            expectActions(getActions(), ['Assign to calendar']);
            delete event.pubstatus;

            // If the Event is rescheduled
            event.state = WORKFLOW_STATE.RESCHEDULED;
            expectActions(getActions(), []);
            event.state = WORKFLOW_STATE.DRAFT;

            // If the Event is expired
            event.expired = true;
            privileges.planning_edit_expired = 0;
            expectActions(getActions(), []);
            privileges.planning_edit_expired = 1;
            expectActions(getActions(), ['Assign to calendar']);
        });
    });

    describe('Duplicate Event', () => {
        const event = {
            _id: 'e1',
            state_reason: 'this is a reason',
            dates: {
                start: moment('2014-10-15T14:01:11+0000'),
                end: moment('2014-10-15T15:01:11+0000'),
                tz: 'Australia/Sydney',
            },
        };

        beforeEach(() => {
            sinon.stub(moment.tz, 'guess').callsFake(() => 'Foo');
        });

        afterEach(() => {
            restoreSinonStub(moment.tz.guess);
        });

        it('remove state_reason for cancelled event', () => {
            let evt = cloneDeep(event);

            evt.state = WORKFLOW_STATE.CANCELLED;

            const duplicateEvent = eventUtils.duplicateEvent(evt, 'foo');

            expect(duplicateEvent.occur_status).toBe('foo');
            expect(duplicateEvent.duplicate_from).toBe(event._id);
            expect(duplicateEvent.hasOwnProperty('state_reason')).toBe(false);
            expect(duplicateEvent.dates.tz).toBe('Foo');
        });

        it('remove state_reason for rescheduled event', () => {
            let evt = cloneDeep(event);

            evt.state = WORKFLOW_STATE.RESCHEDULED;

            const duplicateEvent = eventUtils.duplicateEvent(evt, 'foo');

            expect(duplicateEvent.occur_status).toBe('foo');
            expect(duplicateEvent.duplicate_from).toBe(event._id);
            expect(duplicateEvent.hasOwnProperty('state_reason')).toBe(false);
            expect(duplicateEvent.dates.tz).toBe('Foo');
        });
    });

    describe('getEventsByDate', () => {
        const eventPresentInGroup = (group, event) => ((get(group, 'events', []).filter(
            (e) => e._id === event._id)).length > 0);
        const dummyEvent = {
            _id: 'dummyE1',
            dates: {
                start: moment('2014-10-20T14:01:11+0000'),
                end: moment('2014-10-20T15:01:11+0000'),
                tz: 'Australia/Sydney',
            },
        };

        it('Shows multiple tiles for a multi day event', () => {
            const event = {
                _id: 'e1',
                dates: {
                    start: moment('2014-10-15T14:01:11+0000'),
                    end: moment('2014-10-20T15:01:11+0000'),
                    tz: 'Australia/Sydney',
                },
            };

            const eventsDateGroup = eventUtils.getEventsByDate([event, dummyEvent],
                moment('2014-10-10T14:01:11+0000'), moment('2014-10-25T14:01:11+0000'));
            const keys = Object.keys(eventsDateGroup);

            expect(keys.length > 1).toBe(true);
            keys.forEach((k) => {
                expect(eventPresentInGroup(eventsDateGroup[k], event)).toBe(true);
            });
        });

        it('Restricts number of tiles based on actioned_date attribute', () => {
            const event = {
                _id: 'e1',
                dates: {
                    start: moment('2014-10-15T14:01:11+0000'),
                    end: moment('2014-10-20T15:01:11+0000'),
                    tz: 'Australia/Sydney',
                },
                actioned_date: moment('2014-10-16T15:01:11+0000'),
            };

            const eventsDateGroup = eventUtils.getEventsByDate([event, dummyEvent],
                moment('2014-10-10T14:01:11+0000'), moment('2014-10-25T14:01:11+0000'));

            const eventPresentInGroup = (group, event) => ((get(group, 'events', []).filter(
                (e) => e._id === event._id)).length > 0);

            Object.keys((eventsDateGroup)).forEach((k) => {
                if (event.actioned_date.isSameOrAfter(moment(eventsDateGroup[k].date), 'day')) {
                    expect(eventPresentInGroup(eventsDateGroup[k], event)).toBe(true);
                } else {
                    expect(eventPresentInGroup(eventsDateGroup[k], event)).toBe(false);
                }
            });
        });
    });

    describe('modifyForClient', () => {
        beforeEach(() => {
            sinon.stub(moment.tz, 'guess').callsFake(() => 'Australia/Sydney');
        });

        afterEach(() => {
            restoreSinonStub(moment.tz.guess);
        });

        it('modifies and returns the same variable that was supplied', () => {
            const event = {name: 'test event'};

            expect(eventUtils.modifyForClient(event)).toBe(event);
        });

        it('converts dates and times to moment instances', () => {
            const event = {
                dates: {
                    start: '2014-08-15T04:00:00+0000',
                    end: '2014-08-15T07:00:00+0000',
                    tz: 'Australia/Sydney',
                    recurring_rule: {until: '2014-08-18T04:00:00+0000'},
                },
            };

            expect(eventUtils.modifyForClient(cloneDeep(event))).toEqual({
                dates: {
                    start: moment.tz('2014-08-15T04:00:00+0000', 'Australia/Sydney'),
                    end: moment.tz('2014-08-15T07:00:00+0000', 'Australia/Sydney'),
                    tz: 'Australia/Sydney',
                    recurring_rule: {until: moment.tz('2014-08-18T04:00:00+0000', 'Australia/Sydney')},
                },
                _startTime: moment.tz('2014-08-15T04:00:00+0000', 'Australia/Sydney'),
                _endTime: moment.tz('2014-08-15T07:00:00+0000', 'Australia/Sydney'),
            });
        });

        it('converts dates and times to local timezone', () => {
            const event = {
                dates: {
                    start: '2014-08-15T04:00:00+0000',
                    end: '2014-08-15T07:00:00+0000',
                    tz: 'Australia/Perth',
                    recurring_rule: {until: '2014-08-18T04:00:00+0000'},
                },
            };

            expect(eventUtils.modifyForClient(cloneDeep(event))).toEqual({
                dates: {
                    start: moment.tz('2014-08-15T04:00:00+0000', 'Australia/Sydney'),
                    end: moment.tz('2014-08-15T07:00:00+0000', 'Australia/Sydney'),
                    tz: 'Australia/Perth',
                    recurring_rule: {until: moment.tz('2014-08-18T04:00:00+0000', 'Australia/Sydney')},
                },
                _startTime: moment.tz('2014-08-15T04:00:00+0000', 'Australia/Sydney'),
                _endTime: moment.tz('2014-08-15T07:00:00+0000', 'Australia/Sydney'),
            });
        });

        it('converts location array to object', () => {
            const event = {};

            expect(eventUtils.modifyForClient(cloneDeep(event))).toEqual({});

            event.location = {formatted_address: '123 testing lane'};
            expect(eventUtils.modifyForClient(cloneDeep(event))).toEqual({
                location: {formatted_address: '123 testing lane'},
            });

            event.location = [{formatted_address: '123 testing lane'}];
            expect(eventUtils.modifyForClient(cloneDeep(event))).toEqual({
                location: {formatted_address: '123 testing lane'},
            });
        });

        it('converts unique_id to an integer', () => {
            const event = {};

            expect(eventUtils.modifyForClient(cloneDeep(event))).toEqual({});

            event.unique_id = 12345;
            expect(eventUtils.modifyForClient(cloneDeep(event))).toEqual({
                unique_id: 12345,
            });

            event.unique_id = '12345';
            expect(eventUtils.modifyForClient(cloneDeep(event))).toEqual({
                unique_id: 12345,
            });
        });
    });
});
