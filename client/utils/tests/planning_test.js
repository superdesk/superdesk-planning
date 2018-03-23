import moment from 'moment';
import planUtils from '../planning';
import lockReducer from '../../reducers/locks';
import {EVENTS, PLANNING, ASSIGNMENTS} from '../../constants';
import {expectActions} from '../testUtils';

describe('PlanningUtils', () => {
    let session;
    let locks;
    let lockedItems;

    beforeEach(() => {
        session = {
            identity: {_id: 'ident1'},
            sessionId: 'session1',
        };

        locks = {
            plans: {
                adhoc: {
                    currentUser: {
                        currentSession: {
                            _id: 'p1',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                        otherSession: {
                            _id: 'p2',
                            lock_user: 'ident1',
                            lock_session: 'session2',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                    },
                    otherUser: {
                        _id: 'p3',
                        lock_user: 'ident2',
                        lock_session: 'session3',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                    notLocked: {_id: 'p4'},
                },
                event: {
                    currentUser: {
                        currentSession: {
                            _id: 'p5',
                            event_item: 'e1',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                        otherSession: {
                            _id: 'p6',
                            event_item: 'e2',
                            lock_user: 'ident1',
                            lock_session: 'session2',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                    },
                    otherUser: {
                        _id: 'p7',
                        event_item: 'e3',
                        lock_user: 'ident2',
                        lock_session: 'session3',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                    notLocked: {
                        _id: 'p8',
                        event_item: 'e4',
                    },
                },
                recurring: {
                    currentUser: {
                        currentSession: {
                            _id: 'p9',
                            event_item: 'e5',
                            recurrence_id: 'r1',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                        otherSession: {
                            _id: 'p10',
                            event_item: 'e6',
                            recurrence_id: 'r2',
                            lock_user: 'ident1',
                            lock_session: 'session2',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                    },
                    otherUser: {
                        _id: 'p11',
                        event_item: 'e7',
                        recurrence_id: 'r3',
                        lock_user: 'ident2',
                        lock_session: 'session3',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                    notLocked: {
                        _id: 'p12',
                        event_item: 'e8',
                        recurrence_id: 'r4',
                    },
                },
                associated: {
                    standalone: {
                        _id: 'p13',
                        event_item: 'e9',
                    },
                    recurring: {
                        direct: {
                            _id: 'p14',
                            event_item: 'e10',
                            recurrence_id: 'r5',
                        },
                        indirect: {
                            _id: 'p15',
                            event_item: 'e11',
                            recurrence_id: 'r5',
                        },
                    },
                },
            },
            events: {
                standalone: {
                    _id: 'e9',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                    lock_action: 'edit',
                    lock_time: '2099-10-15T14:30+0000',
                },
                recurring: {
                    _id: 'e10',
                    recurrence_id: 'r5',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                    lock_action: 'edit',
                    lock_time: '2099-10-15T14:30+0000',
                },
            },
        };

        // Use the Lock Reducer to construct the list of locks
        lockedItems = lockReducer({}, {
            type: 'RECEIVE_LOCKS',
            payload: {
                events: [
                    locks.events.standalone,
                    locks.events.recurring,
                ],
                plans: [
                    locks.plans.adhoc.currentUser.currentSession,
                    locks.plans.adhoc.currentUser.otherSession,
                    locks.plans.adhoc.otherUser,
                    locks.plans.event.currentUser.currentSession,
                    locks.plans.event.currentUser.otherSession,
                    locks.plans.event.otherUser,
                    locks.plans.recurring.currentUser.currentSession,
                    locks.plans.recurring.currentUser.otherSession,
                    locks.plans.recurring.otherUser,
                ],
            },
        });
    });

    const isPlanningLocked = (plan, result) => (
        expect(planUtils.isPlanningLocked(plan, lockedItems)).toBe(result)
    );
    const isPlanningLockRestricted = (plan, result) => (
        expect(planUtils.isPlanningLockRestricted(plan, session, lockedItems)).toBe(result)
    );

    it('isPlanningLocked', () => {
        // Null item
        isPlanningLocked(null, false);

        // Ad-hoc Planning
        isPlanningLocked(locks.plans.adhoc.currentUser.currentSession, true);
        isPlanningLocked(locks.plans.adhoc.currentUser.otherSession, true);
        isPlanningLocked(locks.plans.adhoc.otherUser, true);
        isPlanningLocked(locks.plans.adhoc.notLocked, false);

        // Planning items with an associated Event
        isPlanningLocked(locks.plans.event.currentUser.currentSession, true);
        isPlanningLocked(locks.plans.event.currentUser.otherSession, true);
        isPlanningLocked(locks.plans.event.otherUser, true);
        isPlanningLocked(locks.plans.event.notLocked, false);

        // Planning items associated with a series of Recurring Events
        isPlanningLocked(locks.plans.recurring.currentUser.currentSession, true);
        isPlanningLocked(locks.plans.recurring.currentUser.otherSession, true);
        isPlanningLocked(locks.plans.recurring.otherUser, true);
        isPlanningLocked(locks.plans.recurring.notLocked, false);

        // Planning items with locks on the Event
        isPlanningLocked(locks.plans.associated.standalone, true);
        isPlanningLocked(locks.plans.associated.recurring.direct, true);
        isPlanningLocked(locks.plans.associated.recurring.indirect, true);
    });

    it('isPlanningLockRestricted', () => {
        // Null item
        isPlanningLockRestricted(null, false);

        // Ad-hoc Planning
        isPlanningLockRestricted(locks.plans.adhoc.currentUser.currentSession, false);
        isPlanningLockRestricted(locks.plans.adhoc.currentUser.otherSession, true);
        isPlanningLockRestricted(locks.plans.adhoc.otherUser, true);
        isPlanningLockRestricted(locks.plans.adhoc.notLocked, false);

        // Planning items with an associated Event
        isPlanningLockRestricted(locks.plans.event.currentUser.currentSession, false);
        isPlanningLockRestricted(locks.plans.event.currentUser.otherSession, true);
        isPlanningLockRestricted(locks.plans.event.otherUser, true);
        isPlanningLockRestricted(locks.plans.event.notLocked, false);

        // Planning items associated with a series of Recurring Events
        isPlanningLockRestricted(locks.plans.recurring.currentUser.currentSession, false);
        isPlanningLockRestricted(locks.plans.recurring.currentUser.otherSession, true);
        isPlanningLockRestricted(locks.plans.recurring.otherUser, true);
        isPlanningLockRestricted(locks.plans.recurring.notLocked, false);
    });

    describe('createCoverageFromNewsItem', () => {
        const newsCoverageStatus = [{qcode: 'ncostat:int'}];
        const desk = 'desk1';
        const user = 'ident1';
        const contentTypes = [{
            name: 'Picture',
            qcode: 'picture',
            'content item type': 'picture',
        },
        {
            name: 'Text',
            qcode: 'text',
            'content item type': 'text',
        }
        ];

        it('creates photo coverage from unpublished news item', () => {
            const newsItem = {
                slugline: 'slug',
                ednote: 'edit my note',
                type: 'picture',
                state: 'draft',
            };

            const coverage = planUtils.createCoverageFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(coverage).toEqual({
                planning: {
                    g2_content_type: 'picture',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    scheduled: moment().endOf('day'),
                },
                news_coverage_status: {qcode: 'ncostat:int'},
                workflow_status: 'active',
                assigned_to: {
                    desk: 'desk1',
                    user: 'ident1',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
            });
        });

        it('creates text coverage from published news item with past date', () => {
            const newsItem = {
                slugline: 'slug',
                ednote: 'edit my note',
                type: 'text',
                state: 'published',
                versioncreated: '2017-10-15T14:01:11',
                task: {
                    desk: 'desk2',
                    user: 'ident2',
                },
            };

            const coverage = planUtils.createCoverageFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(coverage).toEqual({
                planning: {
                    g2_content_type: 'text',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    scheduled: moment('2017-10-15T14:01:11'),
                },
                news_coverage_status: {qcode: 'ncostat:int'},
                workflow_status: 'active',
                assigned_to: {
                    desk: 'desk2',
                    user: 'ident2',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
            });
        });
    });

    describe('createNewPlanningFromNewsItem', () => {
        const newsCoverageStatus = [{qcode: 'ncostat:int'}];
        const desk = 'desk1';
        const user = 'ident1';
        const contentTypes = [{
            name: 'Picture',
            qcode: 'picture',
            'content item type': 'picture',
        },
        {
            name: 'Text',
            qcode: 'text',
            'content item type': 'text',
        }
        ];

        it('creates photo coverage from unpublished news item', () => {
            const newsItem = {
                _id: 'news1',
                slugline: 'slugger',
                ednote: 'Edit my note!',
                type: 'text',
                subject: 'sub',
                anpa_category: 'cat',
                urgency: 3,
                abstract: '<p>some abstractions</p>',
                state: 'published',
                versioncreated: '2019-10-15T10:01:11',
                task: {
                    desk: 'desk1',
                    user: 'ident1',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
            };

            const plan = planUtils.createNewPlanningFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(plan).toEqual(jasmine.objectContaining({
                type: 'planning',
                slugline: 'slugger',
                ednote: 'Edit my note!',
                subject: 'sub',
                anpa_category: 'cat',
                urgency: 3,
                description_text: 'some abstractions',
                coverages: [{
                    planning: {
                        g2_content_type: 'text',
                        slugline: 'slugger',
                        ednote: 'Edit my note!',
                        scheduled: moment('2019-10-15T10:01:11'),
                    },
                    news_coverage_status: {qcode: 'ncostat:int'},
                    workflow_status: 'active',
                    assigned_to: {
                        desk: 'desk1',
                        user: 'ident1',
                        priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                    },
                }],
            }));
        });

        it('perpetuate `marked_for_not_publication` flag', () => {
            const newsItem = {
                _id: 'news1',
                slugline: 'slugger',
                ednote: 'Edit my note!',
                type: 'text',
                subject: 'sub',
                anpa_category: 'cat',
                urgency: 3,
                abstract: '<p>some abstractions</p>',
                state: 'published',
                versioncreated: '2019-10-15T10:01:11',
                task: {
                    desk: 'desk1',
                    user: 'ident1',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
                flags: {marked_for_not_publication: true}
            };

            const plan = planUtils.createNewPlanningFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(plan).toEqual(jasmine.objectContaining({
                type: 'planning',
                slugline: 'slugger',
                ednote: 'Edit my note!',
                subject: 'sub',
                anpa_category: 'cat',
                urgency: 3,
                description_text: 'some abstractions',
                flags: {marked_for_not_publication: true},
                coverages: [{
                    planning: {
                        g2_content_type: 'text',
                        slugline: 'slugger',
                        ednote: 'Edit my note!',
                        scheduled: moment('2019-10-15T10:01:11'),
                    },
                    news_coverage_status: {qcode: 'ncostat:int'},
                    workflow_status: 'active',
                    assigned_to: {
                        desk: 'desk1',
                        user: 'ident1',
                        priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                    },
                }],
            }));
        });
    });

    describe('getPlanningItemActions', () => {
        const actions = [
            PLANNING.ITEM_ACTIONS.SPIKE,
            PLANNING.ITEM_ACTIONS.UNSPIKE,
            PLANNING.ITEM_ACTIONS.DUPLICATE,

            PLANNING.ITEM_ACTIONS.CANCEL_PLANNING,
            PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE,

            EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
            EVENTS.ITEM_ACTIONS.UPDATE_TIME,
            EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
            EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
            EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
        ];

        let locks;
        let session;
        let planning;
        let event;
        let privileges;

        beforeEach(() => {
            session = {};
            locks = {
                event: {},
                planning: {},
                recurring: {},
            };
            event = null;
            planning = {
                state: 'draft',
                coverages: [],
            };
            privileges = {
                planning_planning_management: 1,
                planning_planning_spike: 1,
                planning_event_management: 1,
                planning_event_spike: 1,
            };
        });

        it('draft event and planning', () => {
            let itemActions = planUtils.getPlanningItemActions(
                planning, event, session, privileges, actions, locks
            );

            expectActions(itemActions, [
                'Spike',
                'Duplicate',
            ]);

            planning.event_item = '1';
            event = {
                state: 'draft',
                planning_ids: ['1'],
            };
            itemActions = planUtils.getPlanningItemActions(
                planning, event, session, privileges, actions, locks
            );

            expectActions(itemActions, [
                'Spike',
                'Duplicate',
                'Cancel Event',
                'Update Event Time',
                'Reschedule Event',
                'Mark Event as Postponed',
                'Convert to recurring event',
            ]);
        });

        it('postponed event and planning', () => {
            planning.state = 'postponed';
            let itemActions = planUtils.getPlanningItemActions(
                planning, event, session, privileges, actions, locks
            );

            expectActions(itemActions, [
                'Duplicate',
            ]);

            planning.event_item = '1';
            event = {
                state: 'postponed',
                planning_ids: ['1'],
            };
            itemActions = planUtils.getPlanningItemActions(
                planning, event, session, privileges, actions, locks
            );

            expectActions(itemActions, [
                'Duplicate',
                'Cancel Event',
                'Reschedule Event',
            ]);
        });
    });
});
