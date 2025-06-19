import {ILockedItems, ILock, IWebsocketMessageData} from '../interfaces';
import {createReducer} from './createReducer';
import {RESET_STORE, INIT_STORE, LOCKS} from '../constants';
import {cloneDeep} from 'lodash';
import {getRelatedEventIdsForPlanning} from '../utils/planning';

const initialLockState: ILockedItems = {
    event: {},
    planning: {},
    recurring: {},
    assignment: {},
};

function removeLock(state: ILockedItems, data: IWebsocketMessageData['ITEM_UNLOCKED']) {
    if (data.recurrence_id != null) {
        delete state.recurring[data.recurrence_id];
    } else if ((data.event_ids?.length ?? 0) > 0) {
        // For now, only support 1 primary event link for locks
        delete state.event[data.event_ids[0]];
    }

    // Always try and delete a lock direclty on the supplied item
    // This can happen when adding an Event from a Planning item
    if (state[data.type][data.item] != null) {
        delete state[data.type][data.item];
    }

    return state;
}

function addLock(state: ILockedItems, data: IWebsocketMessageData['ITEM_LOCKED']) {
    const lockData: ILock = {
        action: data.lock_action,
        item_id: data.item,
        session: data.lock_session,
        time: data.lock_time,
        user: data.user,
        item_type: data.type,
    };

    if (data.recurrence_id != null) {
        state.recurring[data.recurrence_id] = lockData;
    } else if ((data.event_ids?.length ?? 0) > 0) {
        state[data.type][data.item] = lockData;

        // For now, only support 1 primary event link for locks
        state.event[data.event_ids[0]] = lockData;
    } else {
        state[data.type][data.item] = lockData;
    }

    return state;
}

export default createReducer(initialLockState, {
    [RESET_STORE]: () => null,

    [INIT_STORE]: () => initialLockState,

    [LOCKS.ACTIONS.RECEIVE]: (state: ILockedItems, payload: ILockedItems) => (
        {
            event: payload.event || {},
            planning: payload.planning || {},
            recurring: payload.recurring || {},
            assignment: payload.assignment || {},
        }
    ),

    [LOCKS.ACTIONS.SET_ITEM_AS_LOCKED]: (state: ILockedItems, payload: IWebsocketMessageData['ITEM_LOCKED']) => (
        addLock(cloneDeep(state), payload)
    ),

    [LOCKS.ACTIONS.SET_ITEM_AS_UNLOCKED]: (state: ILockedItems, payload: IWebsocketMessageData['ITEM_UNLOCKED']) => (
        removeLock(cloneDeep(state), payload)
    ),

    [LOCKS.ACTIONS.RELOAD_SOFT_LOCKS_FOR_RELATED_EVENTS]: (state: ILockedItems, payload: {planning: IPlanningItem}) => {
        const nextEventLocks = {...state.event};
        const {planning} = payload;

        for (const [eventId, lockObject] of Object.entries(nextEventLocks)) {
            if (lockObject.item_id === planning._id) {
                delete nextEventLocks[eventId];
            }
        }

        for (const relatedEventId of getRelatedEventIdsForPlanning(planning, 'primary')) {
            const currentLock = nextEventLocks[relatedEventId];

            // If planning lock is empty, don't overwrite existing event lock
            if (
                planning.lock_user == null &&
                planning.lock_session == null &&
                planning.lock_action == null
            ) {
                continue;
            }

            nextEventLocks[relatedEventId] = {
                action: planning.lock_action,
                item_id: planning._id,
                item_type: 'planning',
                session: planning.lock_session,
                time: planning.lock_time,
                user: planning.lock_user,
            };
        }

        return {
            ...state,
            event: nextEventLocks,
        };
    },
});
