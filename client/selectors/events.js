import {createSelector} from 'reselect';
import {get, sortBy} from 'lodash';
import moment from 'moment';
import {storedPlannings, currentPlanning} from './planning';
import {agendas} from './general';
import {currentItem} from './forms';

export const storedEvents = (state) =>
    get(state, 'events.events', {})
;
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
    (events) => {
        if (!events) return [];
        // check if search exists
        // order by date
        let sortedEvents = events.sort((a, b) => a.dates.start - b.dates.start);
        const days = {};

        function addEventToDate(event, date) {
            let eventDate = date || event.dates.start;

            eventDate = eventDate.format('YYYY-MM-DD');
            if (!days[eventDate]) {
                days[eventDate] = [];
            }

            days[eventDate].push(event);
        }

        sortedEvents.forEach((event) => {
            // compute the number of days of the event
            if (!event.dates.start.isSame(event.dates.end, 'day')) {
                let deltaDays = Math.max(event.dates.end.diff(event.dates.start, 'days'), 1);
                // if the event happens during more that one day, add it to every day
                // add the event to the other days

                for (let i = 1; i <= deltaDays; i++) {
                    //  clone the date
                    const newDate = moment(event.dates.start);

                    newDate.add(i, 'days');
                    addEventToDate(event, newDate);
                }
            }

            // add event to its initial starting date
            addEventToDate(event);
        });

        let sortable = [];

        for (let day in days) sortable.push({
            date: day,
            events: days[day],
        });
        return sortBy(sortable, [(e) => (e.date)]);
    }
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
                    _agendas: !plannings[id].agendas ? [] :
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
