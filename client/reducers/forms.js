import {AUTOSAVE, EVENTS, PLANNING, FORM_NAMES, MAIN, TEMP_ID_PREFIX} from '../constants';
import {createReducer} from '../utils';
import {pickBy, get} from 'lodash';

const initialState = {
    profiles: {},
    autosaves: {},
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
    if (modal) {
        return {
            ...state,
            itemIdModal: get(payload, '_id') || null,
            itemTypeModal: get(payload, 'type') || null,
            initialValuesModal: payload,
        };
    } else {
        return {
            ...state,
            itemId: get(payload, '_id') || null,
            itemType: get(payload, 'type') || null,
            initialValues: payload,
        };
    }
};

const formsReducer = createReducer(initialState, {
    [AUTOSAVE.ACTIONS.SAVE]: (state, payload) => (
        // If the formName of item ID is not provided,
        // then we return the current state
        (!get(payload, 'formName') || !get(payload, 'diff._id')) ? state :
            {
                ...state,
                autosaves: {
                    ...state.autosaves,
                    [payload.formName]: {
                        ...get(state.autosaves, payload.formName, {}),
                        [payload.diff._id]: payload.diff,
                    },
                },
            }
    ),

    [AUTOSAVE.ACTIONS.REMOVE]: (state, payload) => ({
        ...state,
        autosaves: {
            ...state.autosaves,
            [FORM_NAMES.EventForm]: pickBy(state.autosaves.event, (event, key) => !key.startsWith(TEMP_ID_PREFIX)),
            [FORM_NAMES.PlanningForm]: pickBy(state.autosaves.planning, (plan, key) => !key.startsWith(TEMP_ID_PREFIX)),
        },
    }),

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

    [EVENTS.ACTIONS.UNLOCK_EVENT]: (state, payload) => (
        !get(payload, 'event._id') ? state :
            {
                ...state,
                autosaves: {
                    ...state.autosaves,
                    [FORM_NAMES.EventForm]: pickBy(state.autosaves.event, (event, key) =>
                        !key.startsWith(TEMP_ID_PREFIX) && key !== payload.event._id),
                },
            }
    ),

    [PLANNING.ACTIONS.UNLOCK_PLANNING]: (state, payload) => (
        !get(payload, 'plan._id') ? state :
            {
                ...state,
                autosaves: {
                    ...state.autosaves,
                    [FORM_NAMES.PlanningForm]: pickBy(state.autosaves.planning, (plan, key) =>
                        !key.startsWith(TEMP_ID_PREFIX) && key !== payload.plan._id),
                },
            }
    ),

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
});

export default formsReducer;
