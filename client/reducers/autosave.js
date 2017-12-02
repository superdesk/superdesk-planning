import { AUTOSAVE, EVENTS, PLANNING, FORM_NAMES } from '../constants'
import { createReducer } from '../utils'
import { pickBy, get } from 'lodash'

const initialState = {}

const autosaveReducer = createReducer(initialState, {
    [AUTOSAVE.ACTIONS.SAVE]: (state, payload) => (
        // If the formName of item ID is not provided,
        // then we return the current state
        (!get(payload, 'formName') || !get(payload, 'diff._id')) ? state :
        {
            ...state,
            [payload.formName]: {
                ...get(state, payload.formName, {}),
                [payload.diff._id]: payload.diff,
            },
        }
    ),

    [EVENTS.ACTIONS.UNLOCK_EVENT]: (state, payload) => (
        !get(payload, 'event._id') ? state :
        {
            ...state,
            [FORM_NAMES.EventForm]: pickBy(state.events, (event, key) => key !== payload.event._id),
        }
    ),

    [PLANNING.ACTIONS.UNLOCK_PLANNING]: (state, payload) => (
        !get(payload, 'plan._id') ? state :
        {
            ...state,
            [FORM_NAMES.PlanningForm]: pickBy(state.planning, (plan, key) => key !== payload.plan._id),
        }
    ),
})

export default autosaveReducer
