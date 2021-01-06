import {createSelector} from 'reselect';
import {get, isEmpty, isBoolean} from 'lodash';
import moment from 'moment';

import {appConfig} from 'appConfig';

import {MAIN, SPIKED_STATE} from '../constants';
import {orderedEvents, storedEvents, eventsInList} from './events';
import {orderedPlanningList, storedPlannings, plansInList} from './planning';
import {orderedEventsPlanning, getEventsPlanningList} from './eventsplanning';
import {ITEM_TYPE} from '../constants';
import {getSearchDateRange} from '../utils';


export const activeFilter = (state) => get(state, 'main.filter', MAIN.FILTERS.COMBINED);
export const isEventsPlanningView = (state) =>
    get(state, 'main.filter', '') === MAIN.FILTERS.COMBINED;
export const isEventsView = (state) =>
    get(state, 'main.filter', '') === MAIN.FILTERS.EVENTS;
export const isPlanningView = (state) =>
    get(state, 'main.filter', '') === MAIN.FILTERS.PLANNING;

export const previewId = (state) => get(state, 'main.previewId', null);
export const previewType = (state) => get(state, 'main.previewType', null);
export const previewLoading = (state) => get(state, 'main.loadingPreview', false);
export const previewItemHistory = (state) => get(state, 'main.itemHistory', []);
export const userInitiatedSearch = (state) => get(state, 'main.userInitiatedSearch', false);

export const getPreviewItem = createSelector(
    [previewLoading, previewId, previewType, storedEvents, storedPlannings],
    (previewLoading, itemId, itemType, events, plannings) => {
        if (previewLoading || itemId === null || itemType === null) {
            return null;
        } else if (itemType === ITEM_TYPE.EVENT) {
            return get(events, itemId);
        } else if (itemType === ITEM_TYPE.PLANNING) {
            return get(plannings, itemId);
        }

        return null;
    }
);

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

export const currentJumpInterval = createSelector(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.jumpInterval`) || MAIN.JUMP.WEEK
);

export const currentAdvancedSearch = createSelector(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.currentSearch.advancedSearch`) || {}
);

export const currentStartFilter = createSelector(
    [currentSearch],
    (search) =>
        get(getSearchDateRange(search, appConfig.start_of_week), 'startDate') || moment()
);

export const eventsTotalItems = (state) => get(state, 'main.search.EVENTS.totalItems', 0);
export const planningTotalItems = (state) => get(state, 'main.search.PLANNING.totalItems', 0);
export const combinedTotalItems = (state) => get(state, 'main.search.COMBINED.totalItems', 0);
export const featuredPlanningTotalItems = (state) => get(state, 'main.search.FEATURED_PLANNING.totalItems', 0);
export const loadingIndicator = (state) => get(state, 'main.loadingIndicator', false);

export const lastRequestParams = createSelector(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.lastRequestParams`, {})
);

export const fullText = createSelector(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.fulltext`, '')
);

export const isViewFiltered = createSelector(
    [activeFilter, searchParams],
    (filter, params) => {
        const currentParams = get(params, `${filter}.currentSearch`, {});
        const fullText = get(params, `${filter}.fulltext`, '');

        if (!isEmpty(fullText)) {
            return true;
        }

        return Object.keys(currentParams)
            .some((key) => {
                const value = currentParams[key];

                if (key === 'spikeState') {
                    return value !== SPIKED_STATE.NOT_SPIKED;
                } else if (isBoolean(value)) {
                    return value;
                } else {
                    return !isEmpty(value);
                }
            });
    }
);

export const publishQueuePreviewItem = (state) => get(state, 'selected.preview', null);

export const isAllListItemsLoaded = createSelector(
    [
        eventsInList,
        eventsTotalItems,
        plansInList,
        planningTotalItems,
        getEventsPlanningList,
        combinedTotalItems,
        activeFilter,
    ],
    (
        eventsList,
        totalEvents,
        planningsList,
        totalPlans,
        eventPlanningList,
        totalItems,
        filter
    ) => {
        switch (filter) {
        case MAIN.FILTERS.COMBINED:
            return totalItems === get(eventPlanningList, 'length', 0);
        case MAIN.FILTERS.EVENTS:
            return totalEvents === get(eventsList, 'length', 0);
        case MAIN.FILTERS.PLANNING:
            return totalPlans === get(planningsList, 'length', 0);
        }

        return true;
    }
);
