import {createSelector} from 'reselect';
import {get} from 'lodash';
import {storedPlannings, currentPlanning} from './planning';
import {agendas} from './general';
import {currentItem} from './forms';
import {eventUtils} from '../utils';


export const storedEvents = (state) => get(state, 'events.events', {});
export const eventIdsInList = (state) => get(state, 'events.eventsInList', []);
export const showEventDetails = (state) => get(state, 'events.showEventDetails');
export const eventHistory = (state) => get(state, 'events.eventHistoryItems');

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
    [eventsInList],
    (events) => eventUtils.getEventsByDate(events)
);

export const getEventContacts = (state) => get(state, 'contacts', []);

/** Used for event details */
export const eventWithRelatedDetails = createSelector(
    [showEventDetails, storedEvents, storedPlannings, agendas, getEventContacts],
    (item, events, plannings, agendas, contacts) => {
        const event = get(item, '_id') ? events[item._id] : null;

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

export const planningWithEventDetails = createSelector(
    [currentPlanning, storedEvents],
    (item, events) => item && events[item.event_item]
);

export const planningEditAssociatedEvent = createSelector(
    [currentItem, storedEvents],
    (item, events) => item && events[item.event_item]
);
