import {AUTOSAVE, EVENTS, PLANNING, FORM_NAMES, MAIN} from '../constants';
import {createReducer} from '../utils';
import {pickBy, get} from 'lodash';

const initialState = {
    profiles: {},
    autosaves: {},
    itemId: null,
    itemType: null,
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
                        ...get(state, payload.formName, {}),
                        [payload.diff._id]: payload.diff,
                    },
                }
            }
    ),

    [MAIN.ACTIONS.EDIT]: (state, payload) => ({
        ...state,
        itemId: get(payload, '_id') || null,
        itemType: get(payload, '_type') || null,
    }),

    [EVENTS.ACTIONS.UNLOCK_EVENT]: (state, payload) => (
        !get(payload, 'event._id') ? state :
            {
                ...state,
                autosaves: {
                    ...state.autosaves,
                    [FORM_NAMES.EventForm]: pickBy(state.events, (event, key) => key !== payload.event._id),
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
});

export default formsReducer;
