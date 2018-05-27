import {AUTOSAVE, ITEM_TYPE, MAIN} from '../constants';
import {createReducer, eventUtils, planningUtils, getItemId, getItemType, isTemporaryId} from '../utils';
import {get, cloneDeep} from 'lodash';

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

    // If this is a new item, then initialValues will always be
    // type/id until the item is created
    const initialValues = !isTemporaryId(itemId) ?
        payload :
        {
            _id: itemId,
            type: itemType,
        };

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

    [AUTOSAVE.ACTIONS.SAVE]: (state, payload) => {
        const newState = cloneDeep(state);
        const autosaves = get(newState, `autosaves.${payload.type}`);

        if (payload.type === ITEM_TYPE.EVENT) {
            autosaves[payload._id] = eventUtils.convertToMoment(payload);
        } else if (payload.type === ITEM_TYPE.PLANNING) {
            autosaves[payload._id] = planningUtils.convertCoveragesGenreToObject(payload);
        }

        return newState;
    },

    [AUTOSAVE.ACTIONS.UPDATE_ETAG]: (state, payload) => {
        const newState = cloneDeep(state);
        const {itemType} = payload;
        const itemId = getItemId(payload.item);
        const autosaves = get(newState.autosaves, itemType);
        const autosaveData = get(autosaves, itemId) || {_id: itemId};

        if (itemType === ITEM_TYPE.EVENT) {
            autosaves[itemId] = eventUtils.convertToMoment({
                ...autosaveData,
                ...payload.item,
            });
        } else if (itemType === ITEM_TYPE.PLANNING) {
            autosaves[itemId] = planningUtils.convertCoveragesGenreToObject({
                ...autosaveData,
                ...payload.item,
            });
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

    [AUTOSAVE.ACTIONS.RECEIVE]: (state, payload) => {
        const items = {};

        payload.autosaves.forEach((item) => {
            if (payload.itemType === ITEM_TYPE.EVENT) {
                items[item._id] = eventUtils.convertToMoment(item);
            } else if (payload.itemType === ITEM_TYPE.PLANNING) {
                items[item._id] = planningUtils.convertCoveragesGenreToObject(item);
            }
        });

        return {
            ...state,
            autosaves: {
                ...state.autosaves,
                [payload.itemType]: items,
            },
        };
    },
});

export default formsReducer;
