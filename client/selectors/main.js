import {createSelector} from 'reselect';
import {get} from 'lodash';
import {MAIN} from '../constants';
import {orderedEvents} from './events';
import {orderedPlanningList} from './planning';
import {orderedEventsPlanning} from './eventsplanning';


export const activeFilter = (state) => get(state, 'main.filter', MAIN.FILTERS.COMBINED);
export const isEventsPlanningView = (state) =>
    get(state, 'main.filter', '') === MAIN.FILTERS.COMBINED;
export const previewItem = (state) => get(state, 'main.previewItem', null);
export const itemGroups = createSelector(
    [activeFilter, orderedEvents, orderedPlanningList, orderedEventsPlanning],
    (filter, events, plans, eventsPlannings) => {
        switch (filter) {
        case MAIN.FILTERS.COMBINED:
            return eventsPlannings;
        case MAIN.FILTERS.EVENTS:
            return events;
        case MAIN.FILTERS.PLANNING:
            return plans;
        }

        return [];
    }
);

export const searchParams = (state) => get(state, 'main.search', {});

export const currentSearch = createSelector(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.currentSearch`, {})
);

export const eventsSearch = (state) => get(state, 'main.search.EVENTS.currentSearch', {});
export const planningSearch = (state) => get(state, 'main.search.PLANNING.currentSearch', {});
export const combinedSearch = (state) => get(state, 'main.search.COMBINED.currentSearch', {});

export const eventsTotalItems = (state) => get(state, 'main.search.EVENTS.totalItems', 0);
export const planningTotalItems = (state) => get(state, 'main.search.PLANNING.totalItems', 0);
export const combinedTotalItems = (state) => get(state, 'main.search.COMBINED.totalItems', 0);

export const lastRequestParams = createSelector(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.lastRequestParams`, {})
);

export const fullText = createSelector(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.fulltext`, '')
);
