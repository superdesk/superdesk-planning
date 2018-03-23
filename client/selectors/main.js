import {createSelector} from 'reselect';
import {get, isEmpty, isBoolean} from 'lodash';
import {MAIN, SPIKED_STATE} from '../constants';
import {orderedEvents, storedEvents} from './events';
import {orderedPlanningList, storedPlannings} from './planning';
import {orderedEventsPlanning} from './eventsplanning';
import {ITEM_TYPE} from '../constants';


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

export const eventsTotalItems = (state) => get(state, 'main.search.EVENTS.totalItems', 0);
export const planningTotalItems = (state) => get(state, 'main.search.PLANNING.totalItems', 0);
export const combinedTotalItems = (state) => get(state, 'main.search.COMBINED.totalItems', 0);
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
        const advancedSearch = get(params, `${filter}.currentSearch.advancedSearch`, {});
        const spikedState = get(params, `${filter}.currentSearch.spikeState`, SPIKED_STATE.NOT_SPIKED);
        const fullText = get(params, `${filter}.fulltext`, '');

        if (spikedState !== SPIKED_STATE.NOT_SPIKED || !isEmpty(fullText)) {
            return true;
        }

        if (isEmpty(advancedSearch)) {
            return false;
        }

        return Object.keys(advancedSearch)
            .some((key) => {
                if (key === 'dates') {
                    return !isEmpty(get(advancedSearch, 'dates.start')) ||
                        !isEmpty(get(advancedSearch, 'dates.end')) ||
                        !isEmpty(get(advancedSearch, 'dates.range'));
                }

                if (isBoolean(get(advancedSearch, key))) {
                    return get(advancedSearch, key);
                }

                return !isEmpty(get(advancedSearch, key));
            });
    }
);
