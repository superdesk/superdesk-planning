import {createSelector} from 'reselect';
import {get, sortBy} from 'lodash';

import {appConfig} from 'appConfig';
import {IEventItem, IPlanningAppState, LIST_VIEW_TYPE} from '../interfaces';

import {currentPlanning, storedPlannings} from './planning';
import {agendas, userPreferences} from './general';
import {currentItem, currentItemModal} from './forms';
import {eventUtils, getSearchDateRange} from '../utils';
import {EVENTS, MAIN, SPIKED_STATE} from '../constants';

function getCurrentListViewType(state?: IPlanningAppState) {
    return state?.main?.listViewType ?? LIST_VIEW_TYPE.SCHEDULE;
}
export const storedEvents = (state) => get(state, 'events.events', {});
export const eventIdsInList = (state) => get(state, 'events.eventsInList', []);
export const eventHistory = (state) => get(state, 'events.eventHistoryItems');
export const currentSearch = (state) => get(state, 'main.search.EVENTS.currentSearch');
export const fullText = (state) => get(state, 'main.search.EVENTS.fulltext', '');
export const eventTemplates = (state) => state.events.eventTemplates;
export const currentEventFilterId = (state: IPlanningAppState) => state?.events?.currentFilterId;
const isEventsView = (state) => get(state, 'main.filter', '') === MAIN.FILTERS.EVENTS;

/** Used for the events list */
export const eventsInList = createSelector(
    [storedEvents, eventIdsInList],
    (events, eventIds) => (
        eventIds.map((eventId) => events[eventId])
    )
);

/**
* Will produce an array of days, which contain the day date and
* the associated events.
*/
export const orderedEvents = createSelector(
    [eventsInList, currentSearch, getCurrentListViewType],
    (events, search, viewType) => {
        if (!events?.length) {
            return [];
        } else if (viewType === LIST_VIEW_TYPE.LIST) {
            return [{
                date: null,
                events: events,
            }];
        }

        const dateRange = getSearchDateRange(search, appConfig.start_of_week);

        return eventUtils.getEventsByDate(events, dateRange.startDate, dateRange.endDate);
    }
);

export const orderedEventsList = createSelector(
    [storedEvents, eventIdsInList],
    (events: {[key: string]: IEventItem}, eventIds: Array<IEventItem['_id']>) => (
        eventIds.map((eventId) => events[eventId])
    )
);

export const flattenedEventsInList = createSelector(
    [eventsInList, currentSearch],
    (events, search) => {
        const dateRange = getSearchDateRange(search, appConfig.start_of_week);

        return eventUtils.getFlattenedEventsByDate(events, dateRange.startDate, dateRange.endDate);
    }
);

export const previewId = (state) => get(state, 'main.previewId', null);

export const getEventPreviewRelatedDetails = createSelector(
    [previewId, storedEvents, storedPlannings, agendas],
    (itemId, events, plannings, agendas) => {
        const event = get(events, itemId) || null;

        if (event === null) {
            return null;
        }

        if (event) {
            return {
                ...event,
                _plannings: get(event, 'planning_ids', []).map((id) => ({
                    ...plannings[id],
                    _agendas: !get(plannings[id], 'agendas') ? [] :
                        plannings[id].agendas.map((id) =>
                            agendas.find(((agenda) => agenda._id === id))),
                })),
            };
        }
    }
);

const getRelatedPlanningsForEvent = (itemId, events, plannings, agendas) => {
    const event = get(events, itemId) || null;

    if (event === null) {
        return [];
    }

    if (event) {
        return get(event, 'planning_ids', []).map((id) => ({
            ...plannings[id],
            _agendas: !get(plannings[id], 'agendas') ? [] :
                plannings[id].agendas.map((id) =>
                    agendas.find(((agenda) => agenda._id === id))),
        }));
    }
};

export const editId = (state) => get(state, 'forms.editors.panel.itemId', null);
export const getRelatedPlannings = createSelector(
    [editId, storedEvents, storedPlannings, agendas],
    (itemId, events, plannings, agendas) => getRelatedPlanningsForEvent(itemId, events, plannings, agendas)
);

export const editIdModal = (state) => get(state, 'forms.editors.modal.itemId', null);
export const getRelatedPlanningsForModalEvent = createSelector(
    [editIdModal, storedEvents, storedPlannings, agendas],
    (itemId, events, plannings, agendas) => getRelatedPlanningsForEvent(itemId, events, plannings, agendas)
);

export const planningWithEventDetails = createSelector(
    [currentPlanning, storedEvents],
    (item, events) => item && events[item.event_item]
);

export const planningEditAssociatedEvent = createSelector(
    [currentItem, storedEvents],
    (item, events) => item && events[item.event_item]
);

export const planningEditAssociatedEventModal = createSelector(
    [currentItemModal, storedEvents],
    (item, events) => item && events[item.event_item]
);

export const currentCalendarId = (state) => get(state, 'events.currentCalendarId');
export const calendars = (state) => get(state, 'events.calendars', []);

export const currentCalendar = createSelector(
    [calendars, currentCalendarId],
    (items, calendarId) => {
        if (calendarId === EVENTS.FILTER.NO_CALENDAR_ASSIGNED || calendarId === EVENTS.FILTER.ALL_CALENDARS) {
            return {qcode: calendarId};
        }
        return items.find((calendar) => calendar.qcode === calendarId) || {};
    }
);

export const enabledCalendars = createSelector(
    [calendars],
    (items) =>
        sortBy(
            items.filter((calendar) => !!get(calendar, 'is_active', false)),
            'name'
        )
);

export const disabledCalendars = createSelector(
    [calendars],
    (items) =>
        sortBy(
            items.filter((calendar) => !get(calendar, 'is_active', false)),
            'name'
        )
);

export const getEventFilterParams = createSelector(
    [currentCalendarId, currentSearch, fullText, currentEventFilterId],
    (calendarId, currentSearch, fullText, filterId) => {
        let calendars = null;

        if (calendarId &&
            calendarId !== EVENTS.FILTER.NO_CALENDAR_ASSIGNED &&
            calendarId !== EVENTS.FILTER.ALL_CALENDARS
        ) {
            calendars = [{qcode: calendarId}];
        }

        return {
            noCalendarAssigned: calendarId === EVENTS.FILTER.NO_CALENDAR_ASSIGNED,
            calendars: calendars,
            advancedSearch: get(currentSearch, 'advancedSearch', {}),
            spikeState: get(currentSearch, 'spikeState', SPIKED_STATE.NOT_SPIKED),
            fulltext: fullText,
            filter_id: filterId,
            page: 1,
        };
    }
);

export const usersDefaultCalendar = createSelector(
    [calendars, userPreferences],
    (items, preferences) => {
        const defaultCalendarCode = get(preferences, 'planning:calendar.calendar.qcode');

        return items.find((calendar) => calendar.qcode === defaultCalendarCode) || null;
    }
);

export const defaultCalendarValue = createSelector(
    [usersDefaultCalendar, currentCalendar, isEventsView],
    (defaultCalendar, current, eventsOnlyView) => {
        if (eventsOnlyView &&
            current.qcode !== EVENTS.FILTER.ALL_CALENDARS &&
            current.qcode !== EVENTS.FILTER.NO_CALENDAR_ASSIGNED &&
            get(current, 'is_active', false)
        ) {
            return [current];
        } else if (get(defaultCalendar, 'is_active', false)) {
            return [defaultCalendar];
        }

        return [];
    }
);

export const defaultCalendarFilter = createSelector(
    [usersDefaultCalendar],
    (calendar) => calendar || {qcode: EVENTS.FILTER.DEFAULT}
);
