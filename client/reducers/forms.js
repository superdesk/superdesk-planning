import {AUTOSAVE, EVENTS, PLANNING, FORM_NAMES, MAIN} from '../constants';
import {createReducer} from '../utils';
import {pickBy, get} from 'lodash';

const initialState = {
    profiles: {},
    autosaves: {},
    itemId: null,
    itemType: null,
    initialValues: null,
    loadingEditItem: false,
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
                }
            }
    ),

    [MAIN.ACTIONS.OPEN_EDITOR]: (state, payload) => ({
        ...state,
        itemId: get(payload, '_id') || null,
        itemType: get(payload, 'type') || null,
        initialValues: payload,
    }),

    [MAIN.ACTIONS.CLOSE_EDITOR]: (state) => ({
        ...state,
        itemId: null,
        itemType: null,
        initialValues: null,
    }),

    [EVENTS.ACTIONS.UNLOCK_EVENT]: (state, payload) => (
        !get(payload, 'event._id') ? state :
            {
                ...state,
                autosaves: {
                    ...state.autosaves,
                    [FORM_NAMES.EventForm]: pickBy(state.event, (event, key) => key !== payload.event._id),
                }
            }
    ),

    [PLANNING.ACTIONS.UNLOCK_PLANNING]: (state, payload) => (
        !get(payload, 'plan._id') ? state :
            {
                ...state,
                autosaves: {
                    ...state.autosaves,
                    [FORM_NAMES.PlanningForm]: pickBy(state.planning, (plan, key) => key !== payload.plan._id),
                }
            }
    ),

    [MAIN.ACTIONS.SET_EDIT_ITEM]: (state, payload) => ({
        ...state,
        itemId: payload.itemId,
        itemType: payload.itemType
    }),

    [MAIN.ACTIONS.EDIT_LOADING_START]: (state) => ({
        ...state,
        loadingEditItem: true,
    }),

    [MAIN.ACTIONS.EDIT_LOADING_COMPLETE]: (state) => ({
        ...state,
        loadingEditItem: false,
    }),
});

export default formsReducer;
