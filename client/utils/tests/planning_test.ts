import moment from 'moment';
import {get, omit} from 'lodash';

import {appConfig} from 'appConfig';
import {ILockedItems} from '../../interfaces';

import {lockUtils, planningUtils} from '../index';
import lockReducer from '../../reducers/locks';
import {EVENTS, PLANNING, ASSIGNMENTS, PRIVILEGES} from '../../constants';
import {expectActions} from '../testUtils';
import {sessions} from '../testData';

const contentTypes = [
    {
        name: 'Picture',
        qcode: 'picture',
        'content item type': 'picture',
    },
    {
        name: 'Text',
        qcode: 'text',
        'content item type': 'text',
    },
];

describe('PlanningUtils', () => {
    let session;
    let locks;
    let lockedItems;

    beforeEach(() => {
        session = sessions[0];
        locks = {
            plans: {
                adhoc: {
                    currentUser: {
                        currentSession: {
                            _id: 'p1',
                            type: 'planning',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                        otherSession: {
                            _id: 'p2',
                            type: 'planning',
                            lock_user: 'ident1',
                            lock_session: 'session2',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                    },
                    otherUser: {
                        _id: 'p3',
                        type: 'planning',
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
                            type: 'planning',
                            related_events: [{
                                _id: 'e1',
                                link_type: 'primary',
                            }],
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                        otherSession: {
                            _id: 'p6',
                            type: 'planning',
                            related_events: [{
                                _id: 'e2',
                                link_type: 'primary',
                            }],
                            lock_user: 'ident1',
                            lock_session: 'session2',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                    },
                    otherUser: {
                        _id: 'p7',
                        type: 'planning',
                        related_events: [{
                            _id: 'e3',
                            link_type: 'primary',
                        }],
                        lock_user: 'ident2',
                        lock_session: 'session3',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                    notLocked: {
                        _id: 'p8',
                        type: 'planning',
                        related_events: [{
                            _id: 'e4',
                            link_type: 'primary',
                        }],
                    },
                },
                recurring: {
                    currentUser: {
                        currentSession: {
                            _id: 'p9',
                            type: 'planning',
                            related_events: [{
                                _id: 'e5',
                                link_type: 'primary',
                            }],
                            recurrence_id: 'r1',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                        otherSession: {
                            _id: 'p10',
                            type: 'planning',
                            related_events: [{
                                _id: 'e6',
                                link_type: 'primary',
                            }],
                            recurrence_id: 'r2',
                            lock_user: 'ident1',
                            lock_session: 'session2',
                            lock_action: 'edit',
                            lock_time: '2099-10-15T14:30+0000',
                        },
                    },
                    otherUser: {
                        _id: 'p11',
                        type: 'planning',
                        related_events: [{
                            _id: 'e7',
                            link_type: 'primary',
                        }],
                        recurrence_id: 'r3',
                        lock_user: 'ident2',
                        lock_session: 'session3',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                    notLocked: {
                        _id: 'p12',
                        type: 'planning',
                        related_events: [{
                            _id: 'e8',
                            link_type: 'primary',
                        }],
                        recurrence_id: 'r4',
                    },
                },
                associated: {
                    standalone: {
                        _id: 'p13',
                        type: 'planning',
                        related_events: [{
                            _id: 'e9',
                            link_type: 'primary',
                        }],
                    },
                    recurring: {
                        direct: {
                            _id: 'p14',
                            type: 'planning',
                            related_events: [{
                                _id: 'e10',
                                link_type: 'primary',
                            }],
                            recurrence_id: 'r5',
                        },
                        indirect: {
                            _id: 'p15',
                            type: 'planning',
                            related_events: [{
                                _id: 'e11',
                                link_type: 'primary',
                            }],
                            recurrence_id: 'r5',
                        },
                    },
                },
            },
            events: {
                standalone: {
                    _id: 'e9',
                    type: 'event',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                    lock_action: 'edit',
                    lock_time: '2099-10-15T14:30+0000',
                },
                recurring: {
                    _id: 'e10',
                    type: 'event',
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
                event: {
                    [locks.events.standalone._id]: lockUtils.getLockFromItem(
                        locks.events.standalone
                    ),
                    [locks.plans.event.currentUser.currentSession.related_events[0]._id]: lockUtils.getLockFromItem(
                        locks.plans.event.currentUser.currentSession
                    ),
                    [locks.plans.event.currentUser.otherSession.related_events[0]._id]: lockUtils.getLockFromItem(
                        locks.plans.event.currentUser.otherSession
                    ),
                    [locks.plans.event.otherUser.related_events[0]._id]: lockUtils.getLockFromItem(
                        locks.plans.event.otherUser
                    ),
                },
                recurring: {
                    [locks.events.recurring.recurrence_id]: lockUtils.getLockFromItem(
                        locks.events.recurring
                    ),
                    [locks.plans.recurring.currentUser.currentSession.recurrence_id]: lockUtils.getLockFromItem(
                        locks.plans.recurring.currentUser.currentSession
                    ),
                    [locks.plans.recurring.currentUser.otherSession.recurrence_id]: lockUtils.getLockFromItem(
                        locks.plans.recurring.currentUser.otherSession
                    ),
                    [locks.plans.recurring.otherUser.recurrence_id]: lockUtils.getLockFromItem(
                        locks.plans.recurring.otherUser
                    ),
                },
                planning: {
                    [locks.plans.adhoc.currentUser.currentSession._id]: lockUtils.getLockFromItem(
                        locks.plans.adhoc.currentUser.currentSession
                    ),
                    [locks.plans.adhoc.currentUser.otherSession._id]: lockUtils.getLockFromItem(
                        locks.plans.adhoc.currentUser.otherSession
                    ),
                    [locks.plans.adhoc.otherUser._id]: lockUtils.getLockFromItem(
                        locks.plans.adhoc.otherUser
                    ),
                },
                assignment: {},
            },
        });
    });

    const isPlanningLocked = (plan, result) => (
        expect(lockUtils.isItemLocked(plan, lockedItems)).toBe(result)
    );
    const isPlanningLockRestricted = (plan, result) => (
        expect(lockUtils.isLockRestricted(plan, session, lockedItems)).toBe(result)
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

        it('creates photo coverage from unpublished news item', () => {
            const newsItem = {
                slugline: 'slug',
                ednote: 'edit my note',
                type: 'picture',
                state: 'draft',
                version_creator: 'ident2',
            };

            const coverage = planningUtils.createCoverageFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(omit(coverage, ['coverage_id', 'planning._scheduledTime'])).toEqual({
                planning: {
                    g2_content_type: 'picture',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    scheduled: moment().add(1, 'hour')
                        .startOf('hour'),
                    internal_note: undefined,
                    language: undefined,
                },
                news_coverage_status: {qcode: 'ncostat:int'},
                workflow_status: 'active',
                assigned_to: {
                    desk: 'desk1',
                    user: 'ident2',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
            });
        });

        it('creates text coverage from published news item with past date rounded up', () => {
            const newsItem = {
                slugline: 'slug',
                ednote: 'edit my note',
                type: 'text',
                state: 'published',
                versioncreated: '2017-10-15T14:01:11',
                version_creator: 'ident2',
                task: {
                    desk: 'desk2',
                    user: 'ident2',
                },
                firstpublished: '2017-10-15T16:00:00',
            };

            const coverage = planningUtils.createCoverageFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(omit(coverage, ['coverage_id', 'planning._scheduledTime'])).toEqual({
                planning: {
                    g2_content_type: 'text',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    scheduled: moment(newsItem.firstpublished).add(1, 'hour')
                        .startOf('hour'),
                    internal_note: undefined,
                    language: undefined,
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

        it('coverage time is derived from news item\'s published time', () => {
            const newsItem = {
                slugline: 'slug',
                ednote: 'edit my note',
                type: 'text',
                state: 'published',
                versioncreated: '2017-10-15T14:01:11',
                version_creator: 'ident2',
                task: {
                    desk: 'desk2',
                    user: 'ident2',
                },
                firstpublished: '2017-10-15T16:00:00',
            };

            const coverage = planningUtils.createCoverageFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(omit(coverage, ['coverage_id', 'planning._scheduledTime'])).toEqual({
                planning: {
                    g2_content_type: 'text',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    scheduled: moment(newsItem.firstpublished).add(1, 'hour')
                        .startOf('hour'),
                    internal_note: undefined,
                    language: undefined,
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

        it('coverage time is derived from news item\'s schedule time if item is scheduled for publishing', () => {
            const newsItem = {
                slugline: 'slug',
                ednote: 'edit my note',
                type: 'text',
                state: 'scheduled',
                versioncreated: '2017-10-15T14:01:11',
                version_creator: 'ident2',
                task: {
                    desk: 'desk2',
                    user: 'ident2',
                },
                firstpublished: '2017-10-15T16:00:00',
                schedule_settings: {utc_publish_schedule: '2017-10-15T20:00:00'},
            };

            const coverage = planningUtils.createCoverageFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(omit(coverage, ['coverage_id', 'planning._scheduledTime'])).toEqual({
                planning: {
                    g2_content_type: 'text',
                    slugline: 'slug',
                    ednote: 'edit my note',
                    scheduled: moment(newsItem.schedule_settings.utc_publish_schedule).add(1, 'hour')
                        .startOf('hour'),
                    internal_note: undefined,
                    language: undefined,
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

        it('creates text coverage from unpublished news item with coverate time rounded off to nearest hour', () => {
            const newsItem = {
                _id: 'news1',
                slugline: 'slugger',
                ednote: 'Edit my note!',
                type: 'text',
                subject: 'sub',
                anpa_category: 'cat',
                urgency: 3,
                abstract: '<p>some abstractions</p>',
                state: 'in_progress',
                versioncreated: '2019-10-15T10:01:11',
                version_creator: 'ident1',
                task: {
                    desk: 'desk1',
                    user: 'ident1',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
                place: [{name: 'Australia'}],
            };

            const plan = planningUtils.createNewPlanningFromNewsItem(
                newsItem, newsCoverageStatus, desk, user, contentTypes);

            expect(plan).toEqual(jasmine.objectContaining({
                type: 'planning',
                slugline: 'slugger',
                ednote: 'Edit my note!',
                subject: 'sub',
                anpa_category: 'cat',
                urgency: 3,
                description_text: 'some abstractions',
                place: [{name: 'Australia'}],
                coverages: [jasmine.objectContaining({
                    coverage_id: jasmine.any(String),
                    planning: jasmine.objectContaining({
                        g2_content_type: 'text',
                        slugline: 'slugger',
                        ednote: 'Edit my note!',
                        scheduled: moment().add(1, 'hour')
                            .startOf('hour'),
                        _scheduledTime: moment().add(1, 'hour')
                            .startOf('hour'),
                    }),
                    news_coverage_status: {qcode: 'ncostat:int'},
                    workflow_status: 'active',
                    assigned_to: {
                        desk: 'desk1',
                        user: 'ident1',
                        priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                    },
                })],
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
                state: 'in_progress',
                version_creator: 'ident1',
                versioncreated: '2019-10-15T10:01:11',
                task: {
                    desk: 'desk1',
                    user: 'ident1',
                    priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                },
                flags: {marked_for_not_publication: true},
            };

            const plan = planningUtils.createNewPlanningFromNewsItem(
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
                coverages: [jasmine.objectContaining({
                    coverage_id: jasmine.any(String),
                    planning: jasmine.objectContaining({
                        g2_content_type: 'text',
                        slugline: 'slugger',
                        ednote: 'Edit my note!',
                        scheduled: moment().add(1, 'hour')
                            .startOf('hour'),
                        _scheduledTime: moment().add(1, 'hour')
                            .startOf('hour'),
                    }),
                    news_coverage_status: {qcode: 'ncostat:int'},
                    workflow_status: 'active',
                    assigned_to: {
                        desk: 'desk1',
                        user: 'ident1',
                        priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                    },
                })],
            }));
        });
    });

    describe('getPlanningItemActions', () => {
        const actions = [
            PLANNING.ITEM_ACTIONS.ADD_COVERAGE,
            PLANNING.ITEM_ACTIONS.SPIKE,
            PLANNING.ITEM_ACTIONS.UNSPIKE,
            PLANNING.ITEM_ACTIONS.DUPLICATE,
            PLANNING.ITEM_ACTIONS.EDIT_PLANNING,

            PLANNING.ITEM_ACTIONS.CANCEL_PLANNING,
            PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE,

            EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
            EVENTS.ITEM_ACTIONS.UPDATE_TIME,
            EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
            EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
            EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING,
        ];

        const callBacks = {};

        for (const action of actions) {
            callBacks[action.actionName] = () => {};
        }

        let locks: ILockedItems;
        let session;
        let planning;
        let event;
        let privileges;

        beforeEach(() => {
            session = sessions[0];
            locks = {
                event: {},
                planning: {},
                recurring: {},
                assignment: {},
            };
            event = null;
            planning = {
                _id: 'plan1',
                type: 'planning',
                state: 'draft',
                coverages: [],
            };
            privileges = {
                [PRIVILEGES.PLANNING_MANAGEMENT]: 1,
                [PRIVILEGES.SPIKE_PLANNING]: 1,
                [PRIVILEGES.EVENT_MANAGEMENT]: 1,
                [PRIVILEGES.SPIKE_EVENT]: 1,
            };
        });

        it('draft event and planning', () => {
            const itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, [
                'Spike planning',
                'Duplicate',
                'Edit',
            ]);
        });

        it('postponed event and planning', () => {
            planning.state = 'postponed';

            const itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [event],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, [
                'Duplicate',
                'Edit',
            ]);
        });

        it('canceled event and planning', () => {
            planning.state = 'cancelled';

            let itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [event],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, ['Duplicate', 'Edit']);

            planning.related_events = [{
                _id: '1',
                link_type: 'primary',
            }];

            event = {
                state: 'cancelled',
                planning_ids: ['1'],
            };

            itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [event],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, ['Duplicate', 'Edit']);
        });

        it('rescheduled event and planning', () => {
            planning.state = 'rescheduled';

            let itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [event],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, [
                'Duplicate',
            ]);

            planning.related_events = [{
                _id: '1',
                link_type: 'primary',
            }];

            event = {
                state: 'rescheduled',
                planning_ids: ['1'],
            };

            itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [event],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, [
                'Duplicate',
            ]);
        });

        it('unposted event and unposted planning', () => {
            planning.state = 'killed';

            planning.related_events = [{
                _id: '1',
                link_type: 'primary',
            }];

            event = {
                state: 'killed',
                planning_ids: ['1'],
            };

            let itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [event],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, [
                'Duplicate',
            ]);
        });

        it('posted event and unposted planning', () => {
            planning.state = 'killed';

            planning.related_events = [{
                _id: '1',
                link_type: 'primary',
            }];

            event = {
                state: 'scheduled',
                planning_ids: ['1'],
            };

            let itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [event],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, [
                'Duplicate',
                'Edit',
            ]);
        });

        it('add coverage', () => {
            session = sessions[0];
            planning.lock_user = 'ident1';
            planning.lock_session = 'session1';
            locks.planning.plan1 = {
                item_id: 'plan1',
                item_type: 'planning',
                user: 'ident1',
                session: 'session1',
                action: 'edit',
                time: '2023-04-20T13:01:11+0000',
            };

            let itemActions = planningUtils.getPlanningActions({
                item: planning,
                events: [event],
                session,
                privileges,
                lockedItems: locks,
                callBacks,
                contentTypes,
            });

            expectActions(itemActions, [
                'Add coverage',
                'Spike planning',
                'Duplicate',
                'Edit',
            ]);
        });
    });

    describe('modifyForClient', () => {
        it('convert genre array to object', () => {
            let planning = {
                state: 'draft',
                coverages: [
                    {
                        _id: '123',
                        planning: {
                            genre: [{name: 'foo', qcode: 'bar'}],
                        },
                    },
                ],
            };

            planningUtils.modifyForClient(planning);
            expect(get(planning, 'coverages[0].planning.genre.name')).toEqual('foo');
            expect(get(planning, 'coverages[0].planning.genre.qcode')).toEqual('bar');
        });

        it('if genre an object then don\'t touch genre', () => {
            let planning = {
                state: 'draft',
                coverages: [
                    {
                        _id: '123',
                        planning: {
                            genre: {name: 'foo', qcode: 'bar'},
                        },
                    },
                ],
            };

            planningUtils.modifyForClient(planning);
            expect(get(planning, 'coverages[0].planning.genre.name')).toEqual('foo');
            expect(get(planning, 'coverages[0].planning.genre.qcode')).toEqual('bar');
        });

        it('delete genre field', () => {
            let planning = {
                state: 'draft',
                coverages: [
                    {
                        _id: '123',
                        planning: {genre: null},
                    },
                ],
            };

            planningUtils.modifyForClient(planning);
            expect(get(planning, 'coverages[0].planning')).toEqual({});
        });
    });

    describe('modifyForServer', () => {
        it('convert genre object to array', () => {
            let planning = {
                state: 'draft',
                coverages: [
                    {
                        _id: '123',
                        planning: {
                            genre: {name: 'foo', qcode: 'bar'},
                        },
                    },
                ],
            };

            planningUtils.modifyForServer(planning);
            expect(get(planning, 'coverages[0].planning.genre[0].name')).toEqual('foo');
            expect(get(planning, 'coverages[0].planning.genre[0].qcode')).toEqual('bar');
        });

        it('array is not modified', () => {
            let planning = {
                state: 'draft',
                coverages: [
                    {
                        _id: '123',
                        planning: {
                            genre: [1, 2],
                        },
                    },
                ],
            };

            planningUtils.modifyForServer(planning);
            expect(get(planning, 'coverages[0].planning.genre')).toEqual([1, 2]);
        });

        it('set genre to  null', () => {
            let planning = {
                state: 'draft',
                coverages: [
                    {
                        _id: '123',
                        planning: {},
                    },
                ],
            };

            planningUtils.modifyForServer(planning);
            expect(get(planning, 'coverages[0].planning.genre')).toBeNull(null);
        });
    });

    describe('canRemoveCoverage', () => {
        afterEach(() => {
            appConfig.long_event_duration_threshold = -1;
        });

        it('draft coverages can be removed', () => {
            const planning = {state: 'draft'};
            const coverage = {
                _id: '123',
                planning: {
                    genre: {name: 'foo', qcode: 'bar'},
                },
                workflow_status: 'draft',
            };

            expect(planningUtils.canRemoveCoverage(coverage, planning)).toBe(true);
        });

        it('cancelled coverages can be removed only if planning item is not cancelled', () => {
            const planning = {state: 'draft'};
            const coverage = {
                _id: '123',
                planning: {
                    genre: {name: 'foo', qcode: 'bar'},
                },
                workflow_status: 'cancelled',
            };

            expect(planningUtils.canRemoveCoverage(coverage, planning)).toBe(true);
        });

        it('no coverages can be removed if planning item is cancelled', () => {
            const planning = {state: 'cancelled'};
            const coverage = {
                _id: '123',
                planning: {
                    genre: {name: 'foo', qcode: 'bar'},
                },
                workflow_status: 'draft',
            };

            expect(planningUtils.canRemoveCoverage(coverage, planning)).toBe(false);
        });
    });

    describe('defaultCoverageValues', () => {
        it('set coverage time for adhock planning', () => {
            const newsCoverageStatus = [{qcode: 'ncostat:int'}];
            let planned = moment('2119-03-15T09:00:00+11:00');
            const plan = {slugline: 'Test',
                internal_note: 'Internal Note',
                ednote: 'Ed note',
                planning_date: planned};

            let coverage = planningUtils.defaultCoverageValues(newsCoverageStatus, plan, null);

            expect(get(coverage, 'planning.scheduled').format()).toBe(planned.add(1, 'hour').format());

            planned = moment('2119-03-15T09:33:00+11:00');
            plan.planning_date = planned;
            coverage = planningUtils.defaultCoverageValues(
                newsCoverageStatus,
                plan,
                null
            );

            expect((get(coverage, 'planning.scheduled').format())).toBe(
                planned.add(2, 'hour')
                    .startOf('hour')
                    .format()
            );
        });
        it('set coverage time from event', () => {
            const newsCoverageStatus = [{qcode: 'ncostat:int'}];
            const planned = moment('2119-03-15T09:00:00+11:00');
            let eventEnd = moment('2119-03-17T09:00:00+11:00');
            const plan = {
                slugline: 'Test',
                internal_note: 'Internal Note',
                ednote: 'Ed note',
                planning_date: planned,
                related_events: [{
                    _id: 'xxx',
                    link_type: 'primary',
                }],
            };
            const event = {dates: {end: eventEnd}};

            let coverage = planningUtils.defaultCoverageValues(newsCoverageStatus, plan, event);

            expect(get(coverage, 'planning.scheduled').format()).toBe(eventEnd.add(1, 'hour').format());

            eventEnd = moment('2119-03-17T09:33:00+11:00');
            event.dates.end = eventEnd;

            coverage = planningUtils.defaultCoverageValues(
                newsCoverageStatus,
                plan,
                event
            );

            expect(get(coverage, 'planning.scheduled').format())
                .toBe(eventEnd.add(1, 'hour').format());
        });
        it('no coverage schedule date for long event', () => {
            const newsCoverageStatus = [{qcode: 'ncostat:int'}];
            const planned = moment('2119-03-15T09:00:00+11:00');
            const eventStart = moment('2119-03-17T09:00:00+11:00');
            const eventEnd = moment('2119-03-17T19:00:00+11:00');
            const plan = {
                slugline: 'Test',
                internal_note: 'Internal Note',
                ednote: 'Ed note',
                planning_date: planned,
                related_events: [{
                    _id: 'xxx',
                    link_type: 'primary',
                }],
            };
            const event = {dates: {end: eventEnd, start: eventStart}};

            appConfig.long_event_duration_threshold = 4;
            let coverage = planningUtils.defaultCoverageValues(newsCoverageStatus, plan, event);

            expect(get(coverage, 'planning.scheduled', null)).toBeNull(null);
        });
    });
});
