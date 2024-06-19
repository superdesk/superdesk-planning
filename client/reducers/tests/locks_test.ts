import {IWebsocketMessageData} from '../../interfaces';
import locks from '../locks';
import {LOCKS} from '../../constants';
import {lockUtils} from '../../utils';

function getLockMessageData(item): IWebsocketMessageData['ITEM_LOCKED'] {
    return {
        ...item,
        item: item._id,
        user: item.lock_user,
    };
}

describe('lock reducers', () => {
    let initialState;

    const lockTypes = {
        events: {
            event: {
                _id: 'e1',
                type: 'event',
                lock_action: 'edit',
                lock_session: 'sess123',
                lock_user: 'user123',
                lock_time: '2099-10-15T14:30+0000',
            },
            recurring: {
                _id: 'e2',
                type: 'event',
                recurrence_id: 'r1',
                lock_action: 'postpone',
                lock_session: 'sess123',
                lock_user: 'user123',
                lock_time: '2099-10-15T14:39+0000',
            },
        },
        planning: {
            planning: {
                _id: 'p1',
                type: 'planning',
                lock_action: 'update_time',
                lock_session: 'sess123',
                lock_user: 'user123',
                lock_time: '2099-10-15T14:33+0000',
                event_ids: [],
            },
            event: {
                _id: 'p2',
                type: 'planning',
                event_ids: ['e3'],
                lock_action: 'reschedule',
                lock_session: 'sess123',
                lock_user: 'user123',
                lock_time: '2099-10-15T14:35+0000',
            },
            recurring: {
                _id: 'p3',
                type: 'planning',
                event_ids: ['e7'],
                recurrence_id: 'r2',
                lock_action: 'edit',
                lock_session: 'sess123',
                lock_user: 'user123',
                lock_time: '2099-10-15T14:37+0000',
            },
        },
        assignment: {
            _id: 'a1',
            type: 'assignment',
            lock_action: 'edit',
            lock_session: 'sess123',
            lock_user: 'user123',
            lock_time: '2099-10-15T14:30+0000',
        },
    };

    const lockItems = {
        event: {
            e1: lockUtils.getLockFromItem(lockTypes.events.event),
            e3: lockUtils.getLockFromItem(lockTypes.planning.event),
        },
        planning: {p1: lockUtils.getLockFromItem(lockTypes.planning.planning)},
        recurring: {
            r1: lockUtils.getLockFromItem(lockTypes.events.recurring),
            r2: lockUtils.getLockFromItem(lockTypes.planning.recurring),
        },
        assignment: {a1: lockUtils.getLockFromItem(lockTypes.assignment)},
    };

    const initialLocks = {
        events: [
            lockTypes.events.event,
            lockTypes.events.recurring,
        ],
        plans: [
            lockTypes.planning.planning,
            lockTypes.planning.event,
            lockTypes.planning.recurring,
        ],
        assignments: [lockTypes.assignment],
    };

    const getInitialLocks = () => (locks(
        initialState,
        {
            type: 'RECEIVE_LOCKS',
            payload: lockItems,
        }
    ));

    beforeEach(() => {
        initialState = locks(undefined, {type: null});
    });

    it('initialState', () => {
        expect(initialState).toEqual({
            event: {},
            planning: {},
            recurring: {},
            assignment: {},
        });
    });

    it('RESET_STORE and INIT_STORE', () => {
        let result = locks(
            initialState,
            {type: 'RESET_STORE'}
        );

        expect(result).toBe(null);

        result = locks(
            null,
            {type: 'INIT_STORE'}
        );
        expect(result).toEqual(initialState);
    });

    it('LOCKS.ACTIONS.RECEIVE', () => {
        expect(getInitialLocks()).toEqual(lockItems);
    });

    it('LOCKS.ACTIONS.SET_ITEM_AS_LOCKED - Planning', () => {
        // Planning item with direct Planning lock
        let result = locks(
            initialState,
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_LOCKED,
                payload: getLockMessageData(lockTypes.planning.planning),
            }
        );

        expect(result).toEqual({
            event: {},
            planning: {p1: lockItems.planning.p1},
            recurring: {},
            assignment: {},
        });

        result = locks(
            initialState,
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_LOCKED,
                payload: getLockMessageData(lockTypes.planning.event),
            }
        );
        expect(result).toEqual({
            event: {e3: lockItems.event.e3},
            planning: {},
            recurring: {},
            assignment: {},
        });

        result = locks(
            initialState,
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_LOCKED,
                payload: getLockMessageData(lockTypes.planning.recurring),
            },
        );
        expect(result).toEqual({
            event: {},
            planning: {},
            recurring: {r2: lockItems.recurring.r2},
            assignment: {},
        });
    });

    it('LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED - Planning', () => {
        // Planning item with direct Planning lock
        let result = locks(
            getInitialLocks(),
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED,
                payload: getLockMessageData(lockTypes.planning.planning),
            }
        );

        expect(result).toEqual({
            event: lockItems.event,
            planning: {},
            recurring: lockItems.recurring,
            assignment: lockItems.assignment,
        });

        // Planning item with associated Event lock
        result = locks(
            getInitialLocks(),
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED,
                payload: getLockMessageData(lockTypes.planning.event),
            }
        );
        expect(result).toEqual({
            event: {e1: lockItems.event.e1},
            planning: lockItems.planning,
            recurring: lockItems.recurring,
            assignment: lockItems.assignment,
        });

        // Planning item with associated series of Recurring Events lock
        result = locks(
            getInitialLocks(),
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED,
                payload: getLockMessageData(lockTypes.planning.recurring),
            }
        );
        expect(result).toEqual({
            event: lockItems.event,
            planning: lockItems.planning,
            recurring: {r1: lockItems.recurring.r1},
            assignment: lockItems.assignment,
        });
    });

    it('LOCKS.ACTIONS.SET_ITEM_AS_LOCKED - Events', () => {
        // Event item with direct Event lock
        let result = locks(
            initialState,
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_LOCKED,
                payload: getLockMessageData(lockTypes.events.event),
            }
        );

        expect(result).toEqual({
            event: {e1: lockItems.event.e1},
            planning: {},
            recurring: {},
            assignment: {},
        });

        // Event item with series of Recurring Event lock
        result = locks(
            initialState,
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_LOCKED,
                payload: getLockMessageData(lockTypes.events.recurring),
            }
        );
        expect(result).toEqual({
            event: {},
            planning: {},
            recurring: {r1: lockItems.recurring.r1},
            assignment: {},
        });
    });

    it('LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED - Events', () => {
        // Event item with direct Event lock
        let result = locks(
            getInitialLocks(),
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED,
                payload: getLockMessageData(lockTypes.events.event),
            }
        );

        expect(result).toEqual({
            event: {e3: lockItems.event.e3},
            planning: lockItems.planning,
            recurring: lockItems.recurring,
            assignment: lockItems.assignment,
        });

        // Event item with series of Recurring Events lock
        result = locks(
            getInitialLocks(),
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED,
                payload: getLockMessageData(lockTypes.events.recurring),
            }
        );
        expect(result).toEqual({
            event: lockItems.event,
            planning: lockItems.planning,
            recurring: {r2: lockItems.recurring.r2},
            assignment: lockItems.assignment,
        });
    });

    it('LOCKS.ACTIONS.SET_ITEM_AS_LOCKED - Assignment', () => {
        // Planning item with direct Planning lock
        let result = locks(
            initialState,
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_LOCKED,
                payload: getLockMessageData(lockTypes.assignment),
            }
        );

        expect(result).toEqual({
            event: {},
            planning: {},
            recurring: {},
            assignment: {a1: lockItems.assignment.a1},
        });
    });

    it('LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED - Assignment', () => {
        // Planning item with direct Planning lock
        let result = locks(
            getInitialLocks(),
            {
                type: LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED,
                payload: getLockMessageData(lockTypes.assignment),
            }
        );

        expect(result).toEqual({
            event: lockItems.event,
            planning: lockItems.planning,
            recurring: lockItems.recurring,
            assignment: {},
        });
    });
});
