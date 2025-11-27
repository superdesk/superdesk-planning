import {get, sortBy} from 'lodash';
import {produce} from 'immer';

import {IEventsPlanningState, IMainState, ISearchFilter} from '../interfaces';
import {EVENTS_PLANNING, INIT_STORE, RESET_STORE, MAIN} from '../constants';

import {createReducer} from './createReducer';
import {getItemId} from '../utils';

const initialState: IEventsPlanningState = {
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

const eventsPlanningReducer = createReducer<IEventsPlanningState>(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST]: (state, payload) =>
        produce(state, (draft) => {
            draft.eventsAndPlanningInList = (payload || []).map((e) => e._id);
        }),

    [EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST]: (state, payload) =>
        produce(state, (draft) => {
            const newIds = (payload || []).map((e) => e._id);
            const existingIds = new Set(draft.eventsAndPlanningInList || []);

            newIds.forEach((id) => {
                if (!existingIds.has(id)) {
                    draft.eventsAndPlanningInList.push(id);
                }
            });
        }),

    [EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST]: (state, payload) =>
        produce(state, (draft) => {
            draft.eventsAndPlanningInList = [];
        }),

    [EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS]: (state, payload) => {
        const eventId = getItemId(payload);

        if (!eventId) {
            return state;
        }

        return produce(state, (draft) => {
            draft.relatedPlannings[eventId] = get(payload, 'planning_ids', []);
        });
    },

    [EVENTS_PLANNING.ACTIONS.ADD_OR_REPLACE_EVENTS_PLANNING_FILTER]: (state, payload) =>
        produce(state, (draft) => {
            draft.filters = addOrReplaceFilters([...draft.filters], payload);
        }),

    [EVENTS_PLANNING.ACTIONS.RECEIVE_EVENTS_PLANNING_FILTERS]: (state, payload) =>
        produce(state, (draft) => {
            draft.filters = sortBy([...payload], [(f) => f.name.toLowerCase()]);
        }),

    [EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER]: (state, payload: ISearchFilter['_id']) =>
        produce(state, (draft) => {
            draft.currentFilter = payload === EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING ? null : payload;
        }),

    [MAIN.ACTIONS.CLEAR_SEARCH]: (state, payload: keyof IMainState['search']) =>
        payload !== 'COMBINED' ? state : produce(state, (draft) => {
            draft.currentFilter = null;
        }),
});

export default eventsPlanningReducer;
