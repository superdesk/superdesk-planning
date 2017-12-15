import {createSelector} from 'reselect';
import {get, sortBy} from 'lodash';
import moment from 'moment';
import {storedPlannings} from './planning';

export const storedEvents = (state) => get(state, 'events.events', {});
export const eventIdsInList = (state) => get(state, 'events.eventsInList', []);
export const agendas = (state) => get(state, 'agenda.agendas', []);
export const previewItem = (state) => get(state, 'main.previewItem');
export const eventPreviewHistory = (state) => get(state, 'main.history');

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

/** Used for event details */
export const eventWithRelatedDetails = createSelector(
    [previewItem, storedEvents, storedPlannings, agendas],
    (item, events, plannings, agendas) => {
        const event = get(item, '_id') ? events[item._id] : null;

        if (event) {
            return {
                ...event,
                _plannings: Object.keys(plannings).filter((pKey) => (
                    plannings[pKey].event_item === item._id
                ))
                    .map((key) => ({
                        ...plannings[key],
                        _agendas: !plannings[key].agendas ? [] :
                            plannings[key].agendas.map((id) =>
                                agendas.find(((agenda) => agenda._id === id))),
                    })),
            };
        }
    }
);
