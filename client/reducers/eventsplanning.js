import {EVENTS_PLANNING, INIT_STORE, RESET_STORE, SPIKED_STATE} from '../constants';
import {cloneDeep, get, uniq} from 'lodash';
import {createReducer} from '../utils';

const initialState = {
    eventsAndPlanningInList: [],
    relatedPlannings: {}
};

export const spike = (state, payload) => {
    const spikeState = get(payload, 'spikeState', SPIKED_STATE.NOT_SPIKED);
    const index = state.eventsAndPlanningInList.indexOf(payload.id);

    if (index > -1 && spikeState === SPIKED_STATE.NOT_SPIKED) {
        state.eventsAndPlanningInList.splice(index, 1);
    }

    return state;
};

export const unspike = (state, payload) => {
    const spikeState = get(payload, 'spikeState', SPIKED_STATE.NOT_SPIKED);
    const index = state.eventsAndPlanningInList.indexOf(payload.id);

    if (index > -1 && spikeState === SPIKED_STATE.SPIKED) {
        state.eventsAndPlanningInList.splice(index, 1);
    }

    return state;
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
    [EVENTS_PLANNING.ACTIONS.SPIKE_EVENT]: (state, payload) => (
        spike(cloneDeep(state), payload)
    ),
    [EVENTS_PLANNING.ACTIONS.SPIKE_PLANNING]: (state, payload) => (
        spike(cloneDeep(state), payload)
    ),
    [EVENTS_PLANNING.ACTIONS.SPIKE_RECURRING_EVENTS]: (state, payload) => {
        let newState = cloneDeep(state);

        payload.ids.forEach((event) => {
            spike(newState, {id: event, spikeState: payload.spikeState});
        });

        return newState;
    },
    [EVENTS_PLANNING.ACTIONS.UNSPIKE_EVENT]: (state, payload) => (
        unspike(cloneDeep(state), payload)
    ),
    [EVENTS_PLANNING.ACTIONS.UNSPIKE_PLANNING]: (state, payload) => (
        unspike(cloneDeep(state), payload)
    ),
});

export default eventsPlanningReducer;
