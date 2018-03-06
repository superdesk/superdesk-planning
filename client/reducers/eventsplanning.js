import {EVENTS_PLANNING, INIT_STORE, RESET_STORE} from '../constants';
import {cloneDeep, get, uniq} from 'lodash';
import {createReducer} from '../utils';

const initialState = {
    eventsAndPlanningInList: [],
    relatedPlannings: {}
};


const eventsPlanningReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST]: (state, payload) => (
        {
            ...state,
            eventsAndPlanningInList: (payload || []).map((e) => e._id)
        }
    ),
    [EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST]: (state, payload) => (
        {
            ...state,
            eventsAndPlanningInList: uniq([
                ...cloneDeep(state.eventsAndPlanningInList || []),
                ...(payload || []).map((e) => e._id)
            ])
        }
    ),
    [EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST]: (state, payload) => (
        {
            ...state,
            eventsAndPlanningInList: []
        }
    ),
    [EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS]: (state, payload) => {
        let eventId = get(payload, '_id');

        if (!eventId) {
            return state;
        }

        return {
            ...state,
            relatedPlannings: {
                ...state.relatedPlannings,
                [eventId]: get(payload, 'planning_ids', [])
            }
        };
    },
});

export default eventsPlanningReducer;
