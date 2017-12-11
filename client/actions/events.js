import {pickBy, cloneDeep, get, isEmpty, isNil, isEqual} from 'lodash';
import moment from 'moment-timezone';
import * as selectors from '../selectors';
import {SubmissionError} from 'redux-form';
import {saveLocation as _saveLocation} from './index';
import {fetchSelectedAgendaPlannings} from './index';
import {EventUpdateMethods} from '../components/fields';
import {EVENTS, SPIKED_STATE, PUBLISHED_STATE} from '../constants';
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

/**
 * Set event.pubstatus canceled and publish event.
 *
 * @param {Object} event
 */
function unpublishEvent(event) {
    return function(dispatch, getState, {api, notify}) {
        return api.save('events_publish', {
            event: event._id,
            etag: event._etag,
            pubstatus: PUBLISHED_STATE.CANCELLED,
        })
            .then(() => {
                notify.success('The event has been unpublished');
                dispatch(eventsApi.silentlyFetchEventsById([event._id], SPIKED_STATE.BOTH));
                dispatch(eventsUi.closeEventDetails());
            });
    };
}

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
 * Action Dispatcher for saving an event
 * If there are any files attached, upload these as well
 * @param {object} event - The event item to save
 * @return arrow function
 */
const uploadFilesAndSaveEvent = (event) => {
    const clonedEvent = cloneDeep(event) || {};

    return (dispatch, getState) => (
        dispatch(saveFiles(clonedEvent))
            .then((result) => dispatch(saveLocation(result)))
            .then((result) => dispatch(saveEvent(result)))
        // we used ids to refer to the files, but we need now file object with metadata
        // before to add them to the events storage
            .then((events) => (
                new Promise((resolve) => {
                    const incompleteEvents = events.filter((e) => (
                        e.files && e.files.length > 0 && typeof e.files[0] === 'string'
                    ));

                    if (incompleteEvents.length > 0) {
                        dispatch(eventsApi.query({ids: incompleteEvents.map((i) => (i._id))}))
                            .then((e) => resolve(e._items));
                    } else {
                        resolve(events);
                    }
                })
            ))
        // refresh the list
            .then((events) => (
                dispatch(eventsUi.refetchEvents())
                    .then(() => (events))
            ))
        // If event was just created, open it in editing mode
            .then((events) => {
                if (events.length > 0 && selectors.getShowEventDetails(getState()) === true) {
                    return dispatch(eventsUi.openEventDetails(events[0]))
                        .then(() => events);
                }

                return events;
            })
    );
};

/**
 * Action Dispatcher for uploading files
 * @param {object} newEvent - The event that contains the files to be uploaded
 * @return arrow function
 */
const saveFiles = (newEvent) => {
    const clonedEvent = cloneDeep(newEvent);
    const getId = (e) => (e._id);
    const getIds = (e) => (e.map(getId));

    return (dispatch, getState, {upload}) => (
        new Promise((resolve) => {
            // if no file, do nothing
            if ((clonedEvent.files || []).length === 0) {
                return resolve(clonedEvent);
            }
            // files to upload
            const fileFiles = clonedEvent.files.filter(
                (f) => ((f instanceof FileList && f.length) || f instanceof Array)
            );
            // upload files and link them to the event

            return Promise.all(fileFiles.map((file) => (
                upload.start({
                    method: 'POST',
                    url: getState().config.server.url + '/events_files/',
                    headers: {'Content-Type': 'multipart/form-data'},
                    data: {media: [file]},
                    arrayKey: '',
                    // returns the item
                }).then((d) => (d.data))
            )))
                .then((uploadedFiles) => {
                    clonedEvent.files = [
                    // reference uploaded files to event
                        ...getIds(uploadedFiles),
                        // remove uploaded FileList objects
                        ...getIds(clonedEvent.files.filter((f) => (
                            !isEmpty(f) && fileFiles.indexOf(f) === -1
                        ))),
                    ];
                    return clonedEvent;
                })
                .then(resolve);
        })
    );
};

/**
 * Action Dispatcher for saving the location for an event
 * @param {object} event - The event the location is associated with
 * @return arrow function
 */
const saveLocation = (event) => (
    (dispatch) => {
        // location field was empty, we clear the location
        if (!get(event, 'location[0].name')) {
            event.location = [];
            return event;
        } else if (get(event, 'location[0].existingLocation')) {
            event.location[0] = {
                name: event.location[0].name,
                qcode: event.location[0].guid,
                address: event.location[0].address,
            };

            if (get(event, 'location[0].address.external')) {
                delete event.location[0].address.external;
            }

            return event;
        } else if (get(event, 'location[0]') && isNil(event.location[0].qcode)) {
            // the location is set, but doesn't have a qcode (not registered in the location collection)
            return dispatch(_saveLocation(event.location[0]))
                .then((location) => {
                    event.location[0] = location;
                    return event;
                });
        } else {
            return event;
        }
    }
);

/**
 * Action Dispatcher to create or save an event
 * This action is private to this module only.
 * Also adds the user timezone
 * @param {object} newEvent
 * @return arrow function
 */
const saveEvent = (newEvent) => (
    (dispatch, getState, {api, notify}) => {
        // remove links if it contains only null values
        if (newEvent.links && newEvent.links.length > 0) {
            newEvent.links = newEvent.links.filter((l) => (l));
            if (!newEvent.links.length) {
                delete newEvent.links;
            }
        }
        // retrieve original
        let original = selectors.getEvents(getState())[newEvent._id];
        // clone the original because `save` will modify it

        original = cloneDeep(original) || {};
        let clonedEvent = cloneDeep(newEvent) || {};

        // save the timezone. This is useful for recurring events
        if (clonedEvent.dates) {
            clonedEvent.dates.tz = moment.tz.guess();
        }

        // remove all properties starting with _,
        // otherwise it will fail for "unknown field" with `_type`
        clonedEvent = pickBy(clonedEvent, (v, k) => (
            !k.startsWith('_') &&
            !isEqual(clonedEvent[k], original[k])
        ));

        clonedEvent.update_method = get(clonedEvent, 'update_method.value', EventUpdateMethods[0].value);

        // send the event on the backend
        return api('events').save(original, clonedEvent)
        // return a list of events (can has several because of reccurence)
            .then((data) => (
                data._items || [data]
            ), (error) => {
                notify.error('An error occured');
                throw new SubmissionError({_error: error.statusText});
            });
    }
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
 * Action Dispatcher to fetch events from the server
 * This will add the events to the events list,
 * and update the URL for deep linking
 * @param {object} params - Query parameters to send to the server
 * @return arrow function
 */
const fetchEvents = (params = {
    spikeState: SPIKED_STATE.NOT_SPIKED,
    page: 1,
}) => (
    (dispatch, getState, {$timeout, $location}) => {
        dispatch({
            type: EVENTS.ACTIONS.REQUEST_EVENTS,
            payload: params,
        });

        return dispatch(eventsApi.query(params))
            .then((data) => {
                dispatch(eventsApi.receiveEvents(data._items));
                dispatch(eventsUi.setEventsList(data._items.map((e) => e._id)));
                // update the url (deep linking)
                $timeout(() => (
                    $location.search('searchEvent', JSON.stringify(params)), 0, false)
                );
                return data;
            });
    }
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
        api('events').getById(_id)
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
 * Action to receive the history of actions on Event and store them in the store
 * @param {array} eventHistoryItems - An array of Event History items
 * @return object
 */
const receiveEventHistory = (eventHistoryItems) => ({
    type: EVENTS.ACTIONS.RECEIVE_EVENT_HISTORY,
    payload: eventHistoryItems,
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
    unpublishEvent,
    toggleEventSelection,
    toggleEventsList,
    receiveEventHistory,
    addToEventsList,
    fetchEvents,
    fetchEventById,
    saveFiles,
    uploadFilesAndSaveEvent,
    loadMoreEvents,
    eventNotifications,
    selectAllTheEventList,
    deselectAllTheEventList,
};
