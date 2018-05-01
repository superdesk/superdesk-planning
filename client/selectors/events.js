import {createSelector} from 'reselect';
import {get} from 'lodash';
import {storedPlannings, currentPlanning} from './planning';
import {agendas, userPreferences} from './general';
import {currentItem, currentItemModal} from './forms';
import {getStartOfWeek} from './config';
import {eventUtils, getSearchDateRange} from '../utils';
import {EVENTS, MAIN, SPIKED_STATE} from '../constants';

export const storedEvents = (state) => get(state, 'events.events', {});
export const eventIdsInList = (state) => get(state, 'events.eventsInList', []);
export const eventHistory = (state) => get(state, 'events.eventHistoryItems');
export const currentSearch = (state) => get(state, 'main.search.EVENTS.currentSearch');
export const fullText = (state) => get(state, 'main.search.EVENTS.fulltext', '');
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
    [eventsInList, currentSearch, getStartOfWeek],
    (events, search, startOfWeek) => {
        const dateRange = getSearchDateRange(search, startOfWeek);

        return eventUtils.getEventsByDate(events, dateRange.startDate, dateRange.endDate);
    }
);

export const getEventContacts = (state) => get(state, 'contacts', []);
export const previewId = (state) => get(state, 'main.previewId', null);

export const getContacts = createSelector(
    [getEventContacts],
    (contacts) => contacts
);

export const getEventPreviewRelatedDetails = createSelector(
    [previewId, storedEvents, storedPlannings, agendas, getContacts],
    (itemId, events, plannings, agendas, contacts) => {
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
                _contacts: get(event, 'event_contact_info', []).map((id) => (
                    contacts.find((contact) => contact._id === id))
                ),
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

export const editId = (state) => get(state, 'forms.itemId', null);
export const getRelatedPlannings = createSelector(
    [editId, storedEvents, storedPlannings, agendas],
    (itemId, events, plannings, agendas) => getRelatedPlanningsForEvent(itemId, events, plannings, agendas)
);

export const editIdModal = (state) => get(state, 'forms.itemIdModal', null);
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
        items.filter((calendar) => !!get(calendar, 'is_active', false))
);

export const disabledCalendars = createSelector(
    [calendars],
    (items) =>
        items.filter((calendar) => !get(calendar, 'is_active', false))
);

export const getEventFilterParams = createSelector(
    [currentCalendarId, currentSearch, fullText],
    (calendarId, currentSearch, fullText) => {
        let calendars = null;

        if (calendarId &&
            calendarId !== EVENTS.FILTER.NO_CALENDAR_ASSIGNED &&
            calendarId !== EVENTS.FILTER.ALL_CALENDARS
        ) {
            calendars = [calendarId];
        }

        return {
            noCalendarAssigned: calendarId === EVENTS.FILTER.NO_CALENDAR_ASSIGNED,
            calendars: calendars,
            advancedSearch: get(currentSearch, 'advancedSearch', {}),
            spikeState: get(currentSearch, 'spikeState', SPIKED_STATE.NOT_SPIKED),
            fulltext: fullText,
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
