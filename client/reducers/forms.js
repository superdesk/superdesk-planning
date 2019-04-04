import {AUTOSAVE, ITEM_TYPE, MAIN} from '../constants';
import {createReducer} from './createReducer';
import {eventUtils, planningUtils, getItemId, getItemType} from '../utils';
import {get, set, cloneDeep} from 'lodash';

const initialState = {
    profiles: {},
    autosaves: {
        event: {},
        planning: {},
    },
    editors: {
        panel: {
            itemId: null,
            itemType: null,
            action: null,
            initialValues: null,
            itemHistory: [],
        },
        modal: {
            itemId: null,
            itemType: null,
            action: null,
            initialValues: null,
            itemHistory: [],
        },
    },
};

const updateEditor = (state, modal, updates) => {
    const newState = cloneDeep(state);

    if (modal) {
        newState.editors.modal = {
            ...newState.editors.modal,
            ...updates,
        };
    } else {
        newState.editors.panel = {
            ...newState.editors.panel,
            ...updates,
        };
    }

    return newState;
};

const formsReducer = createReducer(initialState, {
    [MAIN.ACTIONS.OPEN_FOR_EDIT]: (state, payload) => (
        updateEditor(state, payload.modal, {
            itemId: getItemId(payload.item) || null,
            itemType: getItemType(payload.item) || null,
            itemHistory: [],
            action: payload.action,
            initialValues: payload.item,
        })
    ),

    [MAIN.ACTIONS.CHANGE_EDITOR_ACTION]: (state, payload) => (
        updateEditor(state, payload.modal, {
            action: payload.action,
        })
    ),

    [MAIN.ACTIONS.CLOSE_EDITOR]: (state, payload) => (
        updateEditor(state, payload, {
            itemId: null,
            itemType: null,
            itemHistory: [],
            action: null,
            initialValues: null,
        })
    ),

    [AUTOSAVE.ACTIONS.RECEIVE]: (state, payload) => {
        const newState = cloneDeep(state);
        const itemId = getItemId(payload);
        const itemType = getItemType(payload);
        const itemPath = `autosaves.${itemType}["${itemId}"]`;

        if (itemType === ITEM_TYPE.EVENT) {
            set(newState, itemPath, eventUtils.modifyForClient(payload, true));
        } else if (itemType === ITEM_TYPE.PLANNING) {
            set(newState, itemPath, planningUtils.modifyForClient(payload));
        }

        return newState;
    },

    [AUTOSAVE.ACTIONS.REMOVE]: (state, payload) => {
        const itemId = getItemId(payload);
        const itemType = getItemType(payload);

        if (!itemId || !itemType) {
            return state;
        }

        const newState = cloneDeep(state);
        const autosaves = get(newState, `autosaves.${itemType}`);

        if (autosaves[itemId]) {
            delete autosaves[itemId];
        }

        return newState;
    },

    [AUTOSAVE.ACTIONS.RECEIVE_ALL]: (state, payload) => {
        const newState = cloneDeep(state);
        const items = {};

        if (payload.itemType === ITEM_TYPE.EVENT) {
            payload.autosaves.forEach((item) => {
                items[getItemId(item)] = eventUtils.modifyForClient(item, true);
            });
        } else if (payload.itemType === ITEM_TYPE.PLANNING) {
            payload.autosaves.forEach((item) => {
                items[getItemId(item)] = planningUtils.modifyForClient(item);
            });
        }

        set(newState, `autosaves.${payload.itemType}`, items);

        return newState;
    },

    [MAIN.ACTIONS.RECEIVE_EDITOR_ITEM_HISTORY]: (state, payload) => (
        updateEditor(state, payload.modal, {
            itemHistory: payload.items,
        })
    ),
});

export default formsReducer;
