import {get} from 'lodash';
import * as selectors from '../selectors';
import {SubmissionError} from 'redux-form';
import {fetchSelectedAgendaPlannings} from './index';
import {EVENTS, SPIKED_STATE} from '../constants';
import {eventUtils, getErrorMessage, retryDispatch} from '../utils';

import eventsApi from './events/api';
import eventsUi from './events/ui';

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

/** Action factory that fetchs the next page of the previous request */
function loadMoreEvents() {
    return (dispatch, getState) => {
        const previousParams = selectors.getPreviousEventRequestParams(getState());
        const params = {
            ...previousParams,
            page: previousParams.page + 1,
        };

        dispatch({
            type: EVENTS.ACTIONS.REQUEST_EVENTS,
            payload: params,
        });
        return dispatch(eventsApi.query(params))
            .then((data) => {
                dispatch(eventsApi.receiveEvents(data._items));
                dispatch(addToEventsList(data._items.map((e) => e._id)));
            });
    };
}

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
                dispatch(addToEventsList([event._id]));
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
 * Action to add events to the current list
 * This action makes sure the list of events are unique, no duplicates
 * @param {array} eventsIds - An array of Event IDs to add
 * @return {{type: string, payload: *}}
 */
const addToEventsList = (eventsIds) => ({
    type: EVENTS.ACTIONS.ADD_TO_EVENTS_LIST,
    payload: eventsIds,
});

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
    (dispatch) => {
        if (data && data.item) {
            dispatch(fetchEventById(data.item));
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
                eventsApi.query({recurrenceId: data.item}),
                (events) => get(events, '_items.length', 0) > 0,
                5,
                1000
            ))
            // Once we know our Recurring Events can be received from Elasticsearch,
            // go ahead and refresh the current list of events
                .then((data) => {
                    dispatch(eventsUi.refetchEvents());
                    return Promise.resolve(data._items);
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
    addToEventsList,
    fetchEventById,
    loadMoreEvents,
    eventNotifications,
    selectAllTheEventList,
    deselectAllTheEventList,
};
