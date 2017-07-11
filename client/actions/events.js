import { pickBy, cloneDeep, get, isEmpty, isNil, isEqual } from 'lodash'
import moment from 'moment-timezone'
import * as selectors from '../selectors'
import { SubmissionError, getFormInitialValues } from 'redux-form'
import { saveLocation as _saveLocation } from './index'
import { showModal, hideModal, fetchSelectedAgendaPlannings } from './index'
import { SpikeEvent, UpdateRecurrentEventsConfirmation } from '../components/index'
import React from 'react'
import { PRIVILEGES, EVENTS, ITEM_STATE } from '../constants'
import { checkPermission, getErrorMessage, retryDispatch } from '../utils'

import eventsApi from './events/api'
import eventsUi from './events/ui'

const duplicateEvent = (event) => (
    (dispatch) => {
        // copy in order to keep the original
        event = { ...event };
        // remove ids
        [
            '_id',
            'guid',
        ].forEach((key) => delete event[key])
        // keeps only ids for files
        event.files = get(event, 'files', []).map((file) => (file._id || file))
        return dispatch(saveEvent(event))
        .then(() => dispatch(closeEventDetails()))
        .then(() => dispatch(eventsUi.refetchEvents()))
    }
)

const _setEventStatus = ({ eventId, status }) => (
    (dispatch, getState) => {
        // clone event in order to not modify the store
        const event = { ...selectors.getEvents(getState())[eventId] }
        event.pubstatus = status
        return dispatch(saveEvent(event))
        .then((events) => {
            dispatch(previewEvent(events[0]))
        })
    }
)

const publishEvent = (eventId) => setEventStatus({
    eventId,
    status: EVENTS.PUB_STATUS.USABLE,
})

const unpublishEvent = (eventId) => setEventStatus({
    eventId,
    status: EVENTS.PUB_STATUS.WITHHOLD,
})

const toggleEventSelection = ({ event, value }) => (
    {
        type: value ? EVENTS.ACTIONS.SELECT_EVENTS : EVENTS.ACTIONS.DESELECT_EVENT,
        payload: value ? [event] : event,
    }
)

const selectAllTheEventList = () => (
    (dispatch, getState) =>  {
        dispatch({
            type: EVENTS.ACTIONS.SELECT_EVENTS,
            payload: selectors.getEventsIdsToShowInList(getState()),
        })
    }
)
const deselectAllTheEventList = () => (
    { type: EVENTS.ACTIONS.DESELECT_ALL_EVENT }
)

const askConfirmationBeforeSavingEvent = (event) => (
    (dispatch, getState) =>  {
        const originalEvent = getFormInitialValues('addEvent')(getState())
        return new Promise((resolve, reject) => {
            if (isNil(get(event, 'dates.recurring_rule')) &&
                !isNil(get(originalEvent, 'dates.recurring_rule'))) {
                // A recurring event was converted to a non-recurring one
                // Display a confirmation modal indicating the after-effects
                dispatch(showModal({
                    modalType: 'CONFIRMATION',
                    modalProps: {
                        body: 'Only this instance of the recurrent series will be affected.',
                        onCancel: () => reject(),
                        action: () => resolve(),
                    },
                }))

            } else if (originalEvent.recurrence_id && !isEqual(originalEvent.dates, event.dates)) {
                dispatch(eventsApi.query({
                    recurrenceId: originalEvent.recurrence_id,
                    startDateGreaterThan: originalEvent.dates.start,
                }))
                .then((relatedEvents) => {
                    const count = relatedEvents._meta.total
                    if (count > 0) {
                        dispatch(showModal({
                            modalType: 'CONFIRMATION',
                            modalProps: {
                                body: React.createElement(UpdateRecurrentEventsConfirmation, {
                                    updatedEvent: event,
                                    relatedCount: relatedEvents._meta.total,
                                }),
                                onCancel: () => reject(),
                                action: () => resolve(),
                            },
                        }))
                    } else {
                        resolve()
                    }
                })
            } else {
                resolve()
            }
        })
    }
)

/**
 * Action Dispatcher for saving an event with confirmation
 * @param {object} event - The event item to save
 * @return arrow function
 */
const saveEventWithConfirmation = (event) => (
    (dispatch) => {
        dispatch(askConfirmationBeforeSavingEvent(event))
        .then(() => dispatch(uploadFilesAndSaveEvent(event)))
    }
)

/**
 * Action Dispatcher for saving an event with confirmation
 * and then publish the event
 * @param {object} event - The event item to save and publish
 * @return arrow function
 */
const saveAndPublish = (event) => (
    (dispatch) => {
        dispatch(askConfirmationBeforeSavingEvent(event))
        .then(() => dispatch(uploadFilesAndSaveEvent(event)))
        .then(() => dispatch(publishEvent(event._id)))
    }
)
/**
 * Action Dispatcher for saving an event
 * If there are any files attached, upload these as well
 * @param {object} event - The event item to save
 * @return arrow function
 */
const uploadFilesAndSaveEvent = (event) => {
    event = cloneDeep(event) || {}
    return (dispatch, getState) => (
        dispatch(saveFiles(event))
        .then((event) => dispatch(saveLocation(event)))
        .then((event) => dispatch(saveEvent(event)))
        // we used ids to refer to the files, but we need now file object with metadata
        // before to add them to the events storage
        .then((events) => (
            new Promise((resolve) => {
                const incompleteEvents = events.filter((e) => (
                    e.files && e.files.length > 0 && typeof e.files[0] === 'string'
                ))
                if (incompleteEvents.length > 0) {
                    dispatch(eventsApi.query({ ids: incompleteEvents.map((i) => (i._id)) }))
                    .then((e) => resolve(e._items))
                } else {
                    resolve(events)
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
                dispatch(closeEventDetails())
                dispatch(openEventDetails(events[0]))
            }

            return events
        })
    )
}

/**
 * Action dispatcher that marks an Event as active
 * @param {object} event - The Event to unspike
 * @return Promise
 */
const unspikeEvent = (event) => (
    (dispatch, getState, { api, notify }) => (
        api.update('events_unspike', event, {})
        .then(() => {
            notify.success('The Event has been unspiked.')
            dispatch({
                type: EVENTS.ACTIONS.UNSPIKE_EVENT,
                payload: event,
            })

            // Close Unspike event modal
            dispatch(hideModal())

            // Fetch events to reload latest events list
            return dispatch(eventsUi.refetchEvents())
        }, (error) => (
            notify.error(
                getErrorMessage(error, 'There was a problem, Event was not unspiked!')
            )
        ))
    )
)

/**
 * Action Dispatcher for uploading files
 * @param {object} newEvent - The event that contains the files to be uploaded
 * @return arrow function
 */
const saveFiles = (newEvent) => {
    newEvent = cloneDeep(newEvent)
    const getId = (e) => (e._id)
    const getIds = (e) => (e.map(getId))
    return (dispatch, getState, { upload }) => (
        new Promise((resolve) => {
            // if no file, do nothing
            if ((newEvent.files || []).length === 0) {
                return resolve(newEvent)
            }
            // files to upload
            const fileFiles = newEvent.files.filter(
                (f) => ((f instanceof FileList && f.length) || f instanceof Array)
            )
            // upload files and link them to the event
            return Promise.all(fileFiles.map((file) => (
                upload.start({
                    method: 'POST',
                    url: getState().config.server.url + '/events_files/',
                    headers: { 'Content-Type': 'multipart/form-data' },
                    data: { media: [file] },
                    arrayKey: '',
                    // returns the item
                }).then((d) => (d.data))
            )))
            .then((uploadedFiles) => {
                newEvent.files = [
                    // reference uploaded files to event
                    ...getIds(uploadedFiles),
                    // remove uploaded FileList objects
                    ...getIds(newEvent.files.filter((f) => (
                        !isEmpty(f) && fileFiles.indexOf(f) === -1
                    ))),
                ]
                return newEvent
            })
            .then(resolve)
        })
    )
}

/**
 * Action Dispatcher for saving the location for an event
 * @param {object} event - The event the location is associated with
 * @return arrow function
 */
const saveLocation = (event) => (
    (dispatch) => {
        // location field was empty, we clear the location
        if (!get(event, 'location[0].name')) {
            event.location = []
            return event
        }
        // the location is set, but doesn't have a qcode (not registered in the location collection)
        else if (get(event, 'location[0]') && isNil(event.location[0].qcode)) {
            return dispatch(_saveLocation(event.location[0]))
            .then((location) => {
                event.location[0] = location
                return event
            })
        } else {
            return event
        }
    }
)

/**
 * Action Dispatcher to create or save an event
 * This action is private to this module only.
 * Also adds the user timezone
 * @param {object} newEvent
 * @return arrow function
 */
const saveEvent = (newEvent) => (
    (dispatch, getState, { api, notify }) => {
        // remove links if it contains only null values
        if (newEvent.links && newEvent.links.length > 0) {
            newEvent.links = newEvent.links.filter((l) => (l))
            if (!newEvent.links.length) {
                delete newEvent.links
            }
        }
        // retrieve original
        let original = selectors.getEvents(getState())[newEvent._id]
        // clone the original because `save` will modify it
        original = cloneDeep(original) || {}
        newEvent = cloneDeep(newEvent) || {}

        // save the timezone. This is useful for recurring events
        newEvent.dates.tz = moment.tz.guess()

        // remove all properties starting with _,
        // otherwise it will fail for "unknown field" with `_type`
        newEvent = pickBy(newEvent, (v, k) => (
            !k.startsWith('_') &&
            !isEqual(newEvent[k], original[k])
        ))

        // send the event on the backend
        return api('events').save(original, newEvent)
        // return a list of events (can has several because of reccurence)
        .then(data => {
            notify.success('The event has been saved')
            return data._items || [data]
        }, (error) => {
            notify.error('An error occured')
            throw new SubmissionError({ _error: error.statusText })
        })
    }
)

/**
 * Action Dispatcher to fetch events from the server,
 * and add them to the store without adding them to the events list
 * @param {array} ids - An array of Event IDs to fetch
 * @param {string} state - The item state to filter by
 * @return arrow function
 */
const silentlyFetchEventsById = (ids=[], state = ITEM_STATE.ACTIVE) => (
    (dispatch) => (
        dispatch(eventsApi.query({
            // distinct ids
            ids: ids.filter((v, i, a) => (a.indexOf(v) === i)),
            state,
        }))
        .then(data => {
            dispatch(eventsApi.receiveEvents(data._items))
            return Promise.resolve(data._items)
        })
    )
)

/**
 * Action Dispatcher to fetch events from the server
 * This will add the events to the events list,
 * and update the URL for deep linking
 * @param {object} params - Query parameters to send to the server
 * @return arrow function
 */
const fetchEvents = (params={
    state: ITEM_STATE.ACTIVE,
    page: 1,
}) => (
    (dispatch, getState, { $timeout, $location }) => {
        dispatch({
            type: EVENTS.ACTIONS.REQUEST_EVENTS,
            payload: params,
        })

        return dispatch(eventsApi.query(params))
        .then(data => {
            dispatch(eventsApi.receiveEvents(data._items))
            dispatch(eventsUi.setEventsList(data._items.map((e) => e._id)))
            // update the url (deep linking)
            $timeout(() => (
                $location.search('searchEvent', JSON.stringify(params)), 0, false)
            )
            return data
        })
    }
)

/** Action factory that fetchs the next page of the previous request */
function loadMoreEvents() {
    return (dispatch, getState) => {
        const previousParams = selectors.getPreviousEventRequestParams(getState())
        const params = {
            ...previousParams,
            page: previousParams.page + 1,
        }
        dispatch({
            type: EVENTS.ACTIONS.REQUEST_EVENTS,
            payload: params,
        })
        return dispatch(eventsApi.query(params))
        .then(data => {
            dispatch(eventsApi.receiveEvents(data._items))
            dispatch(addToEventsList(data._items.map((e) => e._id)))
        })
    }
}

/**
 * Action Dispatcher to fetch a single event using its ID
 * and add or update the Event in the Redux Store
 * @param {string} _id - The ID of the Event to fetch
 */
const fetchEventById = (_id) => (
    (dispatch, getState, { api, notify }) => (
        api('events').getById(_id)
        .then((event) => {
            dispatch(eventsApi.receiveEvents([event]))
            dispatch(addToEventsList([event._id]))
            return Promise.resolve(event)
        }, (error) => {
            notify.error(getErrorMessage(
                error,
                'Failed to fetch an Event!'
            ))
        })
    )
)

/**
 * Action to add events to the current list
 * This action makes sure the list of events are unique, no duplicates
 * @param {array} eventsIds - An array of Event IDs to add
 * @return {{type: string, payload: *}}
 */
const addToEventsList = (eventsIds) => ({
    type: EVENTS.ACTIONS.ADD_TO_EVENTS_LIST,
    payload: eventsIds,
})

/**
 * Action to open Event Advanced Search panel
 * @return object
 */
const openAdvancedSearch = () => (
    { type: EVENTS.ACTIONS.OPEN_ADVANCED_SEARCH }
)

/**
 * Action to close the Event Advanced Search panel
 * @return object
 */
const closeAdvancedSearch = () => (
    { type: EVENTS.ACTIONS.CLOSE_ADVANCED_SEARCH }
)

/**
 * Opens the Event in preview/read-only mode
 * @param {object} event - The Event ID to preview
 * @return Promise
 */
const previewEvent = (event) => ({
    type: EVENTS.ACTIONS.PREVIEW_EVENT,
    payload: get(event, '_id'),
})

const _unlockAndOpenEventDetails = (event) => (
    (dispatch) => (
        dispatch(_unlockEvent(event)).then((item) => {
            dispatch(eventsApi.receiveEvents([item]))
            // Call openPlanningEditor to obtain a new lock for editing
            dispatch(_openEventDetails(item))
        }, () => (Promise.reject()))
    )
)

/**
 * Opens the Edit Event panel with the supplied Event
 * @param {object} event - The Event ID to edit
 * @return Promise
 */
const _openEventDetails = (event) => (
    (dispatch) => {
        const id = get(event, '_id')
        if (id) {
            const openDetails = {
                type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
                payload: id,
            }

            dispatch(_lockEvent(event)).then((item) => {
                dispatch(openDetails)
                dispatch(eventsApi.receiveEvents([item]))
            }, () => {
                dispatch(openDetails)
            })
        } else {
            dispatch({
                type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
                payload: true,
            })
        }
    }
)

const _lockEvent = (event) => (
    (dispatch, getState, { api, notify }) => (
        api('events_lock', event).save({}, { lock_action: 'edit' })
           .then((item) => (item),
                (error) => {
                    const msg = get(error, 'data._message') || 'Could not lock the event.'
                    notify.error(msg)
                    if (error) throw error
                })
    )
)

const _unlockEvent = (event) => (
    (dispatch, getState, { api, notify }) => (
        api('events_unlock', event).save({})
            .then((item) => (item),
                (error) => {
                    const msg = get(error, 'data._message') || 'Could not unlock the event.'
                    notify.error(msg)
                    throw error
                })
    )
)

/**
 * Action to close the Edit Event panel
 * @return object
 */
const closeEventDetails = (event) => (
    (dispatch, getState) => {
        if (selectors.isEventDetailLockedInThisSession(getState())) {
            dispatch(_unlockEvent(event))
        }

        dispatch({ type: EVENTS.ACTIONS.CLOSE_EVENT_DETAILS })
    }
)

/**
 * Action to receive the history of actions on Event and store them in the store
 * @param {array} eventHistoryItems - An array of Event History items
 * @return object
 */
const receiveEventHistory = (eventHistoryItems) => ({
    type: EVENTS.ACTIONS.RECEIVE_EVENT_HISTORY,
    payload: eventHistoryItems,
})

/**
 * Action to toggle the Events panel
 * @return object
 */
const toggleEventsList = () => (
    { type: EVENTS.ACTIONS.TOGGLE_EVENT_LIST }
)

/**
 * Action Dispatcher to open the Unspike Event modal
 * @param {object} event - The Event to be unspiked
 */
const _openUnspikeEvent = (event) => (
    (dispatch, getState) => {
        const storedPlannings = selectors.getStoredPlannings(getState())
        // Get _plannings for the event
        const eventWithPlannings = {
            ...event,
            _plannings: Object.keys(storedPlannings).filter((pKey) => (
                storedPlannings[pKey].event_item === event._id
            )).map((pKey) => ({ ...storedPlannings[pKey] })),
        }

        return dispatch(showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: React.createElement(SpikeEvent, { eventDetail: eventWithPlannings }),
                action: () => dispatch(unspikeEvent(eventWithPlannings)),
            },
        }))
    }
)

const openEventDetails = checkPermission(
    _openEventDetails,
    PRIVILEGES.EVENT_MANAGEMENT,
    'Unauthorised to edit an event!'
)

const unlockAndOpenEventDetails = checkPermission(
    _unlockAndOpenEventDetails,
    PRIVILEGES.PLANNING_UNLOCK,
    'Unauthorised to edit an event!'
)

const setEventStatus = checkPermission(
    _setEventStatus,
    PRIVILEGES.EVENT_MANAGEMENT,
    'Unauthorised to change the status of an event!'
)

const openUnspikeEvent = checkPermission(
    _openUnspikeEvent,
    PRIVILEGES.UNSPIKE_EVENT,
    'Unauthorised to unspike an event!'
)

// WebSocket Notifications
/**
 * Action Event when a new Event is created
 * @param _e
 * @param {object} data - Events and User IDs
 */
const onEventCreated = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            dispatch(fetchEventById(data.item))
        }
    }
)

/**
 * Action Event when a new Recurring Event is created
 * @param _e
 * @param {object} data - Recurring Event and user IDs
 */
const onRecurringEventCreated = (_e, data) => (
    (dispatch, getState, { notify }) => {
        if (data && data.item) {
            // Perform retryDispatch as the Elasticsearch index may not yet be created
            // (because we receive this notification fast, and we're performing a query not
            // a getById). So continue for 5 times, waiting 1 second between each request
            // until we receive the new events or an error occurs
            return dispatch(retryDispatch(
                eventsApi.query({ recurrenceId: data.item }),
                (events) => get(events, '_items.length', 0) > 0,
                5,
                1000
            ))
            // Once we know our Recurring Events can be received from Elasticsearch,
            // go ahead and refresh the current list of events
            .then((data) => {
                dispatch(eventsUi.refetchEvents())
                return Promise.resolve(data._items)
            }, (error) => {
                notify.error(getErrorMessage(
                    error,
                    'There was a problem fetching Recurring Events!'
                ))
            })
        }
    }
)

/**
 * Action Event when an Event gets unlocked
 * @param _e
 * @param {object} data - Event and User IDs
 */
const onEventUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const event = selectors.getShowEventDetails(getState())
            // If this is the event currently being edited, show popup notification
            if (event === data.item && selectors.isEventDetailLockedInThisSession(getState())) {
                const user =  selectors.getUsers(getState()).find((u) => u._id === data.user)
                dispatch(showModal({
                    modalType: 'NOTIFICATION_MODAL',
                    modalProps: {
                        title: 'Item Unlocked',
                        body: 'The event you were editing was unlocked by \"' +
                            user.display_name + '\"',
                    },
                }))
            }

            let eventInStore = selectors.getEvents(getState())[data.item]
            eventInStore = {
                ...eventInStore,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                _etag: data.etag,
            }
            dispatch(eventsApi.receiveEvents([eventInStore]))
        }
    }
)

/**
 * Action Event when an Event gets updated
 * @param _e
 * @param {object} data - Event and User IDs
 */
const onEventUpdated = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            dispatch(eventsUi.refetchEvents())

            // Get the list of Planning Item IDs that are associated with this Event
            const storedPlans = selectors.getStoredPlannings(getState())
            const eventPlans = Object.keys(storedPlans)
                .filter((pid) => get(storedPlans[pid], 'event_item', null) === data.item)

            // If there are any associated Planning Items, then update the list
            if (eventPlans.length > 0) {
                // Re-fetch the Event, just in case it wasn't loaded by the refetchEvents action
                dispatch(silentlyFetchEventsById([data.item], ITEM_STATE.ALL))
                .then(() => (dispatch(fetchSelectedAgendaPlannings())))
            }
        }
    }
)

// Map of notification name and Action Event to execute
const eventNotifications = {
    'events:created': () => (onEventCreated),
    'events:created:recurring': () => (onRecurringEventCreated),
    'events:updated': () => (onEventUpdated),
    'events:updated:recurring': () => (onEventUpdated),
    'events:spiked': () => (onEventUpdated),
    'events:unspiked': () => (onEventUpdated),
    'events:lock': () => (onEventUpdated),
    'events:unlock': () => (onEventUnlocked),
}

/**
 * Action Dispatcher to fetch event history from the server
 * This will add the history of action on that event in event history list
 * @param {object} eventId - Query parameters to send to the server
 * @return arrow function
 */
const fetchEventHistory = (eventId) => (
    (dispatch, getState, { api }) => (
        // Query the API and sort by created
        api('events_history').query({
            where: { event_id: eventId },
            max_results: 200,
            sort: '[(\'_created\', 1)]',
        })
        .then(data => {
            dispatch(receiveEventHistory(data._items))
            return data
        })
    )
)

export {
    duplicateEvent,
    publishEvent,
    unpublishEvent,
    toggleEventSelection,
    unspikeEvent,
    openUnspikeEvent,
    toggleEventsList,
    receiveEventHistory,
    closeEventDetails,
    previewEvent,
    openEventDetails,
    closeAdvancedSearch,
    openAdvancedSearch,
    addToEventsList,
    fetchEvents,
    fetchEventHistory,
    silentlyFetchEventsById,
    fetchEventById,
    saveFiles,
    uploadFilesAndSaveEvent,
    loadMoreEvents,
    eventNotifications,
    askConfirmationBeforeSavingEvent,
    selectAllTheEventList,
    deselectAllTheEventList,
    unlockAndOpenEventDetails,
    saveEventWithConfirmation,
    saveAndPublish,
}
