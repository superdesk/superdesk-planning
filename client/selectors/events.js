import {createSelector} from 'reselect';
import {get} from 'lodash';
import {storedPlannings, currentPlanning} from './planning';
import {agendas} from './general';
import {currentItem} from './forms';
import {eventUtils, getSearchDateRange} from '../utils';


export const storedEvents = (state) => get(state, 'events.events', {});
export const eventIdsInList = (state) => get(state, 'events.eventsInList', []);
export const eventHistory = (state) => get(state, 'events.eventHistoryItems');
export const currentSearch = (state) => get(state, 'main.search.EVENTS.currentSearch');

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
    [eventsInList, currentSearch],
    (events, search) => {
        const dateRange = getSearchDateRange(search);

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

export const editId = (state) => get(state, 'forms.itemId', null);
export const getRelatedPlannings = createSelector(
    [editId, storedEvents, storedPlannings, agendas],
    (itemId, events, plannings, agendas) => {
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
    }
);

export const planningWithEventDetails = createSelector(
    [currentPlanning, storedEvents],
    (item, events) => item && events[item.event_item]
);

export const planningEditAssociatedEvent = createSelector(
    [currentItem, storedEvents],
    (item, events) => item && events[item.event_item]
);
