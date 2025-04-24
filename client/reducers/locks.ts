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
        data.event_ids.forEach((x) => delete state.event[x]);
    } else if ((data.plan_ids?.length ?? 0) > 0) {
        data.plan_ids.forEach((x) => delete state.planning[x]);
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

        data.event_ids.forEach((x) => {
            state.event[x] = lockData;
        });
    } else if ((data.plan_ids?.length ?? 0) > 0) {
        state[data.type][data.item] = lockData;

        data.plan_ids.forEach((x) => {
            state.planning[x] = lockData;
        });
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

        for (const relatedEventId of getRelatedEventIdsForPlanning(planning)) {
            // lock related planning unless event itself is locked
            // if event itself is locked, locking a related planning item would drop event's lock
            if (nextEventLocks[relatedEventId]?.item_type !== 'event') {
                nextEventLocks[relatedEventId] = {
                    action: planning.lock_action,
                    item_id: planning._id,
                    item_type: 'planning',
                    session: planning.lock_session,
                    time: planning.lock_time,
                    user: planning.lock_user,
                };
            }
        }

        return {
            ...state,
            event: nextEventLocks,
        };
    },

    [LOCKS.ACTIONS.RELOAD_SOFT_LOCKS_FOR_ASSOCIATED_PLANNINGS]: (state: ILockedItems, payload: {event: IEventItem}) => {
        const nextPlanLocks = {...state.planning};
        const {event} = payload;

        for (const [eventId, lockObject] of Object.entries(nextPlanLocks)) {
            if (lockObject.item_id === event._id) {
                delete nextPlanLocks[eventId];
            }
        }

        for (const associatedPlanId of (event.associated_plannings ?? []).map((x) => x._id)) {
            if (nextPlanLocks[associatedPlanId]?.item_type !== 'planning') {
                nextPlanLocks[associatedPlanId] = {
                    action: event.lock_action,
                    item_id: event._id,
                    item_type: 'event',
                    session: event.lock_session,
                    time: event.lock_time,
                    user: event.lock_user,
                };
            }
        }

        return {
            ...state,
            planning: nextPlanLocks,
        };
    }
});
