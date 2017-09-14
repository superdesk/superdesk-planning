import planUtils from '../planning'
import lockReducer from '../../reducers/locks'

describe('PlanningUtils', () => {
    let session
    let locks
    let lockedItems

    beforeEach(() => {
        session = {
            identity: { _id: 'ident1' },
            sessionId: 'session1',
        }

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
                    notLocked: { _id: 'p4' },
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
        }

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
        })
    })

    const isPlanningLocked = (plan, result) => (
        expect(planUtils.isPlanningLocked(plan, lockedItems)).toBe(result)
    )
    const isPlanningLockRestricted = (plan, result) => (
        expect(planUtils.isPlanningLockRestricted(plan, session, lockedItems)).toBe(result)
    )

    it('isPlanningLocked', () => {
        // Null item
        isPlanningLocked(null, false)

        // Ad-hoc Planning
        isPlanningLocked(locks.plans.adhoc.currentUser.currentSession, true)
        isPlanningLocked(locks.plans.adhoc.currentUser.otherSession, true)
        isPlanningLocked(locks.plans.adhoc.otherUser, true)
        isPlanningLocked(locks.plans.adhoc.notLocked, false)

        // Planning items with an associated Event
        isPlanningLocked(locks.plans.event.currentUser.currentSession, true)
        isPlanningLocked(locks.plans.event.currentUser.otherSession, true)
        isPlanningLocked(locks.plans.event.otherUser, true)
        isPlanningLocked(locks.plans.event.notLocked, false)

        // Planning items associated with a series of Recurring Events
        isPlanningLocked(locks.plans.recurring.currentUser.currentSession, true)
        isPlanningLocked(locks.plans.recurring.currentUser.otherSession, true)
        isPlanningLocked(locks.plans.recurring.otherUser, true)
        isPlanningLocked(locks.plans.recurring.notLocked, false)

        // Planning items with locks on the Event
        isPlanningLocked(locks.plans.associated.standalone, true)
        isPlanningLocked(locks.plans.associated.recurring.direct, true)
        isPlanningLocked(locks.plans.associated.recurring.indirect, true)
    })

    it('isPlanningLockRestricted', () => {
        // Null item
        isPlanningLockRestricted(null, false)

        // Ad-hoc Planning
        isPlanningLockRestricted(locks.plans.adhoc.currentUser.currentSession, false)
        isPlanningLockRestricted(locks.plans.adhoc.currentUser.otherSession, true)
        isPlanningLockRestricted(locks.plans.adhoc.otherUser, true)
        isPlanningLockRestricted(locks.plans.adhoc.notLocked, false)

        // Planning items with an associated Event
        isPlanningLockRestricted(locks.plans.event.currentUser.currentSession, false)
        isPlanningLockRestricted(locks.plans.event.currentUser.otherSession, true)
        isPlanningLockRestricted(locks.plans.event.otherUser, true)
        isPlanningLockRestricted(locks.plans.event.notLocked, false)

        // Planning items associated with a series of Recurring Events
        isPlanningLockRestricted(locks.plans.recurring.currentUser.currentSession, false)
        isPlanningLockRestricted(locks.plans.recurring.currentUser.otherSession, true)
        isPlanningLockRestricted(locks.plans.recurring.otherUser, true)
        isPlanningLockRestricted(locks.plans.recurring.notLocked, false)
    })
})
