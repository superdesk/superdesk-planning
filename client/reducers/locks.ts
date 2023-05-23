import {ILockedItems, ILock, IWebsocketMessageData} from '../interfaces';
import {createReducer} from './createReducer';
import {RESET_STORE, INIT_STORE, LOCKS} from '../constants';
import {cloneDeep, get} from 'lodash';

const initialLockState: ILockedItems = {
    event: {},
    planning: {},
    recurring: {},
    assignment: {},
};

function removeLock(state: ILockedItems, data: IWebsocketMessageData['ITEM_UNLOCKED']) {
    if (data.recurrence_id != null) {
        delete state.recurring[data.recurrence_id];
    } else if (data.event_item != null) {
        delete state.event[data.event_item];
    } else {
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
    } else if (data.event_item != null) {
        state.event[data.event_item] = lockData;
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
});
