import {createSelector} from 'reselect';
import {get, sortBy, uniq, keyBy} from 'lodash';
import {getStartOfWeek} from './config';
import {storedEvents} from './events';
import {storedPlannings} from './planning';
import {eventUtils, getSearchDateRange, planningUtils} from '../utils';
import {EVENTS_PLANNING, SPIKED_STATE} from '../constants';
import {userPreferences} from './general';


export const getEventsPlanningList = (state) => get(state, 'eventsPlanning.eventsAndPlanningInList', []);
export const getRelatedPlanningsList = (state) => get(state, 'eventsPlanning.relatedPlannings', {});
export const currentSearch = (state) => get(state, 'main.search.COMBINED.currentSearch');
export const fullText = (state) => get(state, 'main.search.COMBINED.fulltext', '');
export const combinedViewFilters = (state) => get(state, 'eventsPlanning.filters', []);
export const selectedFilter = (state) => get(state, 'eventsPlanning.currentFilter', null);

export const usersDefaultFilter = createSelector(
    [combinedViewFilters, userPreferences],
    (filters, preferences) => {
        const defaultFilter = get(preferences, 'planning:events_planning_filter.filter.qcode');

        return filters.find((filter) => filter._id === defaultFilter) || null;
    }
);

export const currentFilter = createSelector(
    [usersDefaultFilter, selectedFilter],
    (userDefault, selectedId) => (selectedId || get(userDefault, '_id') || EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING)
);

/**
 * Selector for Ordered Events and adHoc Planning.
 * @type {Reselect.Selector<any, any>}
 */
export const orderedEventsPlanning = createSelector(
    [storedEvents, storedPlannings, getEventsPlanningList, currentSearch, getStartOfWeek],
    (events, plannings, eventPlanningList, search, startOfWeek) => {
        const eventsList = [];
        const planningList = [];
        const dateRange = getSearchDateRange(search, startOfWeek);

        eventPlanningList.forEach((_id) => {
            if (_id in events) {
                eventsList.push(events[_id]);
            } else {
                planningList.push(plannings[_id]);
            }
        });

        const eventsByDate = eventsList.length ?
            keyBy(eventUtils.getEventsByDate(
                eventsList, dateRange.startDate, dateRange.endDate
            ), 'date') : {};
        const planningByDate = planningList.length ?
            keyBy(planningUtils.getPlanningByDate(
                planningList, {}, dateRange.startDate, dateRange.endDate
            ), 'date') : {};
        const days = uniq(Object.keys(eventsByDate).concat(Object.keys(planningByDate)));

        let sortable = [];

        days.forEach((day) => {
            const events = sortBy(
                get(eventsByDate, `${day}.events`, [])
                    .concat(get(planningByDate, `${day}.events`, [])), '_sortDate');

            sortable.push({
                date: day,
                events: events,
            });
        });

        return sortBy(sortable, [(e) => (e.date)]);
    }
);

/**
 * Selector for related planning for an event
 * @type {Reselect.Selector<any, any>}
 */
export const getRelatedPlanningsInList = createSelector(
    [storedPlannings, getRelatedPlanningsList],
    (plannings, relatedPlanningsList) => {
        let relatedPlannings = {};

        Object.keys(relatedPlanningsList).forEach((eventId) => {
            let planningIds = get(relatedPlanningsList, eventId, []);

            relatedPlannings[eventId] = planningIds.map((pid) => get(plannings, pid, {}));
        });

        return relatedPlannings;
    }
);


/**
 * Selector to calculate search params for combined view
 * @type {Reselect.Selector<any, any>}
 */
export const getEventsPlanningViewParams = createSelector(
    [currentFilter, currentSearch, fullText, combinedViewFilters],
    (filterId, search, fullTextParam, filters) => {
        let agendas = [], calendars = [];

        if (filterId !== EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING) {
            const filter = filters.find((f) => f._id === filterId);

            agendas = get(filter, 'agendas') || [];
            calendars = get(filter, 'calendars') || [];
        }

        const queryParams = {
            advancedSearch: get(search, 'advancedSearch', {}),
            spikeState: get(search, 'spikeState', SPIKED_STATE.NOT_SPIKED),
            fulltext: fullTextParam,
            eventsPlanningFilter: filterId || EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING,
            agendas: agendas,
            calendars: calendars,
            page: 1,
        };

        return queryParams;
    }
);