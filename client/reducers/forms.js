import {AUTOSAVE, ITEM_TYPE, MAIN} from '../constants';
import {createReducer, eventUtils, planningUtils, getItemId, getItemType, isTemporaryId} from '../utils';
import {get, set, cloneDeep} from 'lodash';

const initialState = {
    profiles: {},
    autosaves: {
        event: {},
        planning: {},
    },
    itemId: null,
    itemType: null,
    initialValues: null,
    loadingEditItem: false,
    itemIdModal: null,
    itemTypeModal: null,
    initialValuesModal: null,
    loadingEditItemModal: false,
};

const newStateOnEditorOpen = (state, payload, modal = false) => {
    const itemId = getItemId(payload) || null;
    const itemType = getItemType(payload) || null;

    // If this is a new item, then set initialValues to the default for
    // the item type
    let initialValues;

    if (!isTemporaryId(itemId) || get(payload, 'duplicate_from')) {
        initialValues = payload;
    } else if (itemType === ITEM_TYPE.EVENT) {
        initialValues = {
            ...eventUtils.defaultEventValues(),
            _id: payload._id,
            occur_status: payload.occur_status,
            dates: payload.dates,
            calendars: payload.calendars,
        };
    } else if (itemType === ITEM_TYPE.PLANNING) {
        initialValues = {
            ...planningUtils.defaultPlanningValues(),
            _id: payload._id,
            agendas: payload.agendas,
            planning_date: payload.planning_date,
        };
    }

    if (modal) {
        return {
            ...state,
            itemIdModal: itemId,
            itemTypeModal: itemType,
            initialValuesModal: initialValues,
        };
    } else {
        return {
            ...state,
            itemId: itemId,
            itemType: itemType,
            initialValues: initialValues,
        };
    }
};

const formsReducer = createReducer(initialState, {
    [MAIN.ACTIONS.OPEN_EDITOR]: (state, payload) => (newStateOnEditorOpen(state, payload)),

    [MAIN.ACTIONS.OPEN_EDITOR_MODAL]: (state, payload) => (newStateOnEditorOpen(state, payload, true)),

    [MAIN.ACTIONS.CLOSE_EDITOR]: (state) => ({
        ...state,
        itemId: null,
        itemType: null,
        initialValues: null,
    }),

    [MAIN.ACTIONS.CLOSE_EDITOR_MODAL]: (state) => ({
        ...state,
        itemIdModal: null,
        itemTypeModal: null,
        initialValuesModal: null,
    }),

    [MAIN.ACTIONS.SET_EDIT_ITEM]: (state, payload) => ({
        ...state,
        itemId: payload.itemId,
        itemType: payload.itemType,
    }),

    [MAIN.ACTIONS.EDIT_LOADING_START]: (state) => ({
        ...state,
        loadingEditItem: true,
    }),

    [MAIN.ACTIONS.EDIT_LOADING_COMPLETE]: (state) => ({
        ...state,
        loadingEditItem: false,
    }),

    [MAIN.ACTIONS.EDIT_LOADING_START_MODAL]: (state) => ({
        ...state,
        loadingEditItemModal: true,
    }),

    [MAIN.ACTIONS.EDIT_LOADING_COMPLETE_MODAL]: (state) => ({
        ...state,
        loadingEditItemModal: false,
    }),

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
});

export default formsReducer;
