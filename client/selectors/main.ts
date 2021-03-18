import {createSelector} from 'reselect';
import {get, isBoolean, isEmpty, cloneDeep} from 'lodash';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {
    IPlanningAppState,
    LIST_VIEW_TYPE,
    PLANNING_VIEW,
    SORT_FIELD,
    SORT_ORDER,
    ICombinedEventOrPlanningSearchParams,
} from '../interfaces';

import {ITEM_TYPE, MAIN, SPIKED_STATE} from '../constants';
import {currentEventFilterId, eventsInList, orderedEvents, storedEvents} from './events';
import {currentPlanningFilterId, orderedPlanningList, plansInList, storedPlannings} from './planning';
import {getEventsPlanningList, orderedEventsPlanning, selectedFilter} from './eventsplanning';
import {getSearchDateRange} from '../utils';


export const getCurrentListViewType = (state?: IPlanningAppState) => (
    state?.main?.listViewType ?? LIST_VIEW_TYPE.SCHEDULE
);
export const activeFilter = (state: IPlanningAppState) => (
    state?.main?.filter ?? PLANNING_VIEW.COMBINED
);
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

export const getCurrentSortOrder = createSelector(
    [currentSearch],
    (params) => params.sortOrder ?? SORT_ORDER.ASCENDING
);

export const getCurrentSortField = createSelector(
    [currentSearch],
    (params) => params.sortField ?? SORT_FIELD.SCHEDULE,
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

export const currentSearchFilterId = createSelector(
    [activeFilter, selectedFilter, currentEventFilterId, currentPlanningFilterId],
    (view, combinedFilterId, eventsFilterId, planningFilterId) => {
        switch (view) {
        case MAIN.FILTERS.COMBINED:
            return combinedFilterId;
        case MAIN.FILTERS.EVENTS:
            return eventsFilterId;
        case MAIN.FILTERS.PLANNING:
            return planningFilterId;
        }
    }
);

export const eventsTotalItems = (state) => get(state, 'main.search.EVENTS.totalItems', 0);
export const planningTotalItems = (state) => get(state, 'main.search.PLANNING.totalItems', 0);
export const combinedTotalItems = (state) => get(state, 'main.search.COMBINED.totalItems', 0);
export const featuredPlanningTotalItems = (state) => get(state, 'main.search.FEATURED_PLANNING.totalItems', 0);
export const loadingIndicator = (state) => get(state, 'main.loadingIndicator', false);

export const lastRequestParams = createSelector<
    IPlanningAppState,
    PLANNING_VIEW,
    IPlanningAppState['main']['search'],
    ICombinedEventOrPlanningSearchParams
>(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.lastRequestParams`, {})
);

export const fullText = createSelector(
    [activeFilter, searchParams],
    (filter, params) => get(params, `${filter}.fulltext`, '')
);

export const isViewFiltered = createSelector<
    IPlanningAppState,
    PLANNING_VIEW,
    IPlanningAppState['main']['search'],
    boolean
>(
    [activeFilter, searchParams],
    (filter, mainSearch) => {
        // Clone the params so we aren't affecting the original
        const params = cloneDeep(mainSearch[filter].currentSearch ?? {});
        const advancedSearch = cloneDeep(params.advancedSearch ?? {});

        // Remove fields that we don't want to calculate
        const exclude: Array<keyof ICombinedEventOrPlanningSearchParams> = [
            'filter_id',
            'timezoneOffset',
            'advancedSearch',
            'itemIds',
            'page',
            'startOfWeek',
            'sortField',
            'sortOrder',
        ];

        exclude.forEach((field) => {
            delete params[field];
        });

        // Remove params that are the same as the defaults
        const defaults: Partial<ICombinedEventOrPlanningSearchParams> = {
            spikeState: 'draft',
            maxResults: 50,
            onlyFuture: true,
        };

        Object.keys(defaults).forEach((field) => {
            if (params[field] === defaults[field]) {
                delete params[field];
            }
        });

        // Flatten all params into a single dictionary
        const allParams = {
            ...params,
            ...advancedSearch,
        };

        return Object.keys(allParams)
            .some((key) => {
                const value = allParams[key];

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
