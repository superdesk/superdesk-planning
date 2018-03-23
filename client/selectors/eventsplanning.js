import {createSelector} from 'reselect';
import {get, sortBy, uniq, keyBy} from 'lodash';
import {storedEvents} from './events';
import {storedPlannings} from './planning';
import {eventUtils, getSearchDateRange, planningUtils} from '../utils';


export const getEventsPlanningList = (state) => get(state, 'eventsPlanning.eventsAndPlanningInList', []);
export const getRelatedPlanningsList = (state) => get(state, 'eventsPlanning.relatedPlannings', {});
export const currentSearch = (state) => get(state, 'main.search.COMBINED.currentSearch');

/**
 * Selector for Ordered Events and adHoc Planning.
 * @type {Reselect.Selector<any, any>}
 */
export const orderedEventsPlanning = createSelector(
    [storedEvents, storedPlannings, getEventsPlanningList, currentSearch],
    (events, plannings, eventPlanningList, search) => {
        const eventsList = [];
        const planningList = [];
        const dateRange = getSearchDateRange(search);

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
                events: events
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
