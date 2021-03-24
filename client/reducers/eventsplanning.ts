import {EVENTS_PLANNING, INIT_STORE, RESET_STORE} from '../constants';
import {cloneDeep, get, uniq, sortBy} from 'lodash';
import {createReducer} from './createReducer';
import {getItemId} from '../utils';

const initialState = {
    eventsAndPlanningInList: [],
    relatedPlannings: {},
    filters: [],
    currentFilter: null,
};

/**
 * Creates a new filter if it doesn't exist, otherwise updates the existing one
 * @param {array, object} filters - Array of filters
 * @param {object} filter - The filter to create or update
 * @return {*}
 */
const addOrReplaceFilters = (filters, filter) => {
    const index = filters.findIndex((f) => f._id === filter._id);

    if (index === -1) {
        filters.push(filter);
    } else {
        filters.splice(index, 1, filter);
    }
    return sortBy(filters, [(f) => f.name.toLowerCase()]);
};

const eventsPlanningReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST]: (state, payload) => (
        {
            ...state,
            eventsAndPlanningInList: (payload || []).map((e) => e._id),
        }
    ),
    [EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST]: (state, payload) => (
        {
            ...state,
            eventsAndPlanningInList: uniq([
                ...cloneDeep(state.eventsAndPlanningInList || []),
                ...(payload || []).map((e) => e._id),
            ]),
        }
    ),
    [EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST]: (state, payload) => (
        {
            ...state,
            eventsAndPlanningInList: [],
        }
    ),
    [EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS]: (state, payload) => {
        const eventId = getItemId(payload);

        if (!eventId) {
            return state;
        }

        return {
            ...state,
            relatedPlannings: {
                ...state.relatedPlannings,
                [eventId]: get(payload, 'planning_ids', []),
            },
        };
    },
    [EVENTS_PLANNING.ACTIONS.ADD_OR_REPLACE_EVENTS_PLANNING_FILTER]: (state, payload) => (
        {
            ...state,
            filters: addOrReplaceFilters([...state.filters], payload),
        }
    ),
    [EVENTS_PLANNING.ACTIONS.RECEIVE_EVENTS_PLANNING_FILTERS]: (state, payload) => (
        {
            ...state,
            filters: sortBy([...payload], [(f) => f.name.toLowerCase()]),
        }
    ),
    [EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER]: (state, payload) => (
        {
            ...state,
            currentFilter: payload,
        }
    ),
});

export default eventsPlanningReducer;
