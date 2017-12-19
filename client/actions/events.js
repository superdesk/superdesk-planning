import {get} from 'lodash';
import * as selectors from '../selectors';
import {SubmissionError} from 'redux-form';
import {fetchSelectedAgendaPlannings} from './index';
import {EVENTS, SPIKED_STATE} from '../constants';
import {eventUtils, getErrorMessage, retryDispatch} from '../utils';

import eventsApi from './events/api';
import eventsUi from './events/ui';
import eventsPlanningUi from './eventsPlanning/ui';


const duplicateEvent = (event) => (
    (dispatch) => {
        var duplicate = null;
        var original = event;

        return dispatch(createDuplicate(event))
            .then((dup) => {
                duplicate = dup[0];

                // On duplicate, backend returns with just _ids for files
                // Replace them with file media information from original event to be used in editor
                duplicate.files = event.files;
                dispatch(eventsUi.closeEventDetails(original));
            })
            .then(() => dispatch(eventsUi.refetchEvents()))
            .then(() => dispatch(eventsUi.openEventDetails(duplicate)));
    }
);

const toggleEventSelection = ({event, value}) => (
    {
        type: value ? EVENTS.ACTIONS.SELECT_EVENTS : EVENTS.ACTIONS.DESELECT_EVENT,
        payload: value ? [event] : event,
    }
);

const selectAllTheEventList = () => (
    (dispatch, getState) => {
        dispatch({
            type: EVENTS.ACTIONS.SELECT_EVENTS,
            payload: selectors.getEventsIdsToShowInList(getState()),
        });
    }
);

const deselectAllTheEventList = () => (
    {type: EVENTS.ACTIONS.DESELECT_ALL_EVENT}
);


/**
 * Action Dispatcher to create a duplicate of the passed event
 * This action is private to this module only.
 * @param {object} event
 * @return arrow function
 */
const createDuplicate = (event) => (
    (dispatch, getState, {api, notify}) => (
        api('events_duplicate', event).save({})
            .then((data) => {
                notify.success('The event has been duplicated');
                return data._items || [data];
            }, (error) => {
                notify.error('An error occured when duplicating the event');
                throw new SubmissionError({_error: error.statusText});
            })
    )
);

/**
 * Action Dispatcher to fetch a single event using its ID
 * and add or update the Event in the Redux Store
 * @param {string} _id - The ID of the Event to fetch
 */
const fetchEventById = (_id) => (
    (dispatch, getState, {api, notify}) => (
        api.find('events', _id, {embedded: {files: 1}})
            .then((event) => {
                dispatch(eventsApi.receiveEvents([event]));
                dispatch(eventsUi.addToList([event._id]));
                return Promise.resolve(event);
            }, (error) => {
                notify.error(getErrorMessage(
                    error,
                    'Failed to fetch an Event!'
                ));
            })
    )
);

/**
 * Action to toggle the Events panel
 * @return object
 */
const toggleEventsList = () => (
    {type: EVENTS.ACTIONS.TOGGLE_EVENT_LIST}
);

// WebSocket Notifications
/**
 * Action Event when a new Event is created
 * @param _e
 * @param {object} data - Events and User IDs
 */
const onEventCreated = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            return dispatch(fetchEventById(data.item))
                .then(() => dispatch(eventsPlanningUi.refetch()));
        }
    }
);

/**
 * Action Event when a new Recurring Event is created
 * @param _e
 * @param {object} data - Recurring Event and user IDs
 */
const onRecurringEventCreated = (_e, data) => (
    (dispatch, getState, {notify}) => {
        if (data && data.item) {
            // Perform retryDispatch as the Elasticsearch index may not yet be created
            // (because we receive this notification fast, and we're performing a query not
            // a getById). So continue for 5 times, waiting 1 second between each request
            // until we receive the new events or an error occurs
            return dispatch(retryDispatch(
                eventsApi.query({recurrenceId: data.item, onlyFuture: false}),
                (events) => get(events, 'length', 0) > 0,
                5,
                1000
            ))
            // Once we know our Recurring Events can be received from Elasticsearch,
            // go ahead and refresh the current list of events
                .then((items) => {
                    dispatch(eventsUi.refetchEvents());
                    dispatch(eventsPlanningUi.refetch());
                    return Promise.resolve(items);
                }, (error) => {
                    notify.error(getErrorMessage(
                        error,
                        'There was a problem fetching Recurring Events!'
                    ));
                });
        }
    }
);

/**
 * Action Event when an Event gets updated
 * @param _e
 * @param {object} data - Event and User IDs
 */
const onEventUpdated = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            dispatch(eventsUi.refetchEvents())
                .then((events) => {
                    const selectedEvents = selectors.getSelectedEvents(getState());

                    // If the event is currently selected and not loaded from refetchEvents,
                    // then manually reload this event from the server
                    if (selectedEvents.indexOf(data.item) !== -1 &&
                    !events.find((event) => event._id === data.item)) {
                        dispatch(eventsApi.silentlyFetchEventsById([data.item], SPIKED_STATE.BOTH));
                    }

                    // If there are any associated Planning Items, then update the list
                    if (eventUtils.isEventAssociatedWithPlannings(data.item,
                        selectors.getStoredPlannings(getState()))) {
                        dispatch(fetchSelectedAgendaPlannings());
                    }

                    dispatch(eventsPlanningUi.refetch());
                });
        }
    }
);

// Map of notification name and Action Event to execute
const eventNotifications = {
    'events:created': () => (onEventCreated),
    'events:created:recurring': () => (onRecurringEventCreated),
    'events:updated': () => (onEventUpdated),
    'events:updated:recurring': () => (onEventUpdated),
    'events:unspiked': () => (onEventUpdated),
};

export {
    duplicateEvent,
    toggleEventSelection,
    toggleEventsList,
    fetchEventById,
    eventNotifications,
    selectAllTheEventList,
    deselectAllTheEventList,
};
