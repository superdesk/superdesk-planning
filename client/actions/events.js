import { pickBy, cloneDeep, get, isEmpty, isNil } from 'lodash'
import moment from 'moment-timezone'
import * as selectors from '../selectors'
import { SubmissionError } from 'redux-form'
import { saveLocation as _saveLocation } from './index'
import { showModal, hideModal, fetchSelectedAgendaPlannings,
    fetchAgendas, closePlanningEditor } from './index'
import { DeleteEvent } from '../components/index'
import React from 'react'

/**
 * Action Dispatcher for saving an event
 * If there are any files attached, upload these as well
 * @param {object} event - The event item to save
 * @return arrow function
 */
export function uploadFilesAndSaveEvent(event) {
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
                    dispatch(performFetchQuery({ ids: incompleteEvents.map((i) => (i._id)) }))
                    .then((e) => resolve(e._items))
                } else {
                    resolve(events)
                }
            })
        ))
        .then((events) => {
            // add the events to the store
            dispatch(receiveEvents(events))
            // add the events in the list
            dispatch(addToEventsList(events.map((e) => e._id)))

            return events
        }).then((events) => {
            // If event was just created, open it in editing mode
            if (events.length > 0 && selectors.getShowEventDetails(getState()) === true) {
                dispatch(closeEventDetails())
                dispatch(openEventDetails(events[0]._id))
            }
        })
    )
}

/**
 * Action Dispatcher for deleting an event
 * If there are planning items associated with this event, reload the list
 * of Agendas and Planning items as well
 * @param {object} event - The event to delete
 * @return arrow function
 */
export function deleteEvent(event) {
    return (dispatch, getState, { api }) => {
        if (event) {
            return api('events').remove(event)
            .then(() => {
                // Close delete event modal
                dispatch(hideModal())
                // Fetch events to reload latest events list
                dispatch(fetchEvents())

                if (event._plannings) {
                    // Fetch agendas, etc. as they are affected too
                    event._plannings.forEach((planning) => {
                        if (selectors.getCurrentPlanningId(getState()) === planning._id) {
                            dispatch(closePlanningEditor())
                            dispatch({
                                type: 'DELETE_PLANNING',
                                payload: planning._id,
                            })
                        }
                    })

                    dispatch(fetchAgendas())
                    // reloads the plannings to show
                    .then(() => (dispatch(fetchSelectedAgendaPlannings())))
                }
            }, (error) => {
                throw new SubmissionError({ _error: error.statusText })
            })
        }
    }
}

/**
 * Action Dispatcher for uploading files
 * @param {object} newEvent - The event that contains the files to be uploaded
 * @return arrow function
 */
export function saveFiles(newEvent) {
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
function saveLocation(event) {
    return (dispatch) => {
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
}

/**
 * Action Dispatcher to create or save an event
 * This action is private to this module only.
 * Also adds the user timezone, and notify the form to reset and hide the modal
 * @param {object} newEvent
 * @return arrow function
 */
function saveEvent(newEvent) {
    return (dispatch, getState, { api, notify }) => {
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
        // remove all properties starting with _,
        // otherwise it will fail for "unknown field" with `_type`
        newEvent = pickBy(newEvent, (v, k) => (!k.startsWith('_')))
        // save the timezone. This is useful for recurring events
        newEvent.dates.tz = moment.tz.guess()
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
}

/**
 * Action Dispatcher for query the api for events
 * You can provide one of the following parameters to fetch from the server
 * @param {object} advancedSearch - Query parameters to send to the server
 * @param {object} fulltext - Full text search parameters
 * @param {array} ids - An array of Event IDs to fetch
 * @return arrow function
 */
function performFetchQuery({ advancedSearch, fulltext, ids }) {
    return (dispatch, getState, { api }) => {
        const query = {}
        const filter = {}
        // If there is a fulltext, search by term
        if (fulltext) {
            query.bool = {
                should: [
                { match: { name: fulltext } },
                { match: { definition_short: fulltext } },
                ],
            }
        // search by ids
        } else if (ids) {
            filter.bool = { should: ids.map((i) => ({ term: { _id: i } })) }
        // advanced search
        } else if (advancedSearch) {
            const should = [];
            [
                {
                    condition: () => (advancedSearch.name),
                    do: () => {
                        should.push(
                            { match: { name: advancedSearch.name } },
                            { match: { definition_short: advancedSearch.name } }
                        )
                    },
                },
                {
                    condition: () => (advancedSearch.source),
                    do: () => {
                        const providers = advancedSearch.source.map((provider) => provider.name)
                        const queries = providers.map((provider) => (
                            { match: { source: provider } }
                        ))
                        should.push(...queries)
                    },
                },
                {
                    condition: () => (advancedSearch.location),
                    do: () => {
                        should.push(
                            { match: { 'location.name': advancedSearch.location } }
                        )
                    },
                },
                {
                    condition: () => (advancedSearch.anpa_category),
                    do: () => {
                        const codes = advancedSearch.anpa_category.map((cat) => cat.qcode)
                        const queries = codes.map((code) => (
                            { match: { 'anpa_category.qcode': code } }
                        ))
                        should.push(...queries)
                    },
                },
                {
                    condition: () => (advancedSearch.dates),
                    do: () => {
                        const range = {}

                        if (advancedSearch.dates.start) {
                            range['dates.start'] = { gte: advancedSearch.dates.start }
                        }

                        if (advancedSearch.dates.end) {
                            range['dates.end'] = { lte: advancedSearch.dates.end }
                        }

                        filter.range = range
                    },
                },
            // loop over actions and performs if conditions are met
            ].forEach((action) => {
                if (action.condition()) {
                    action.do()
                }
            })
            // build the query
            if (should.length > 0) {
                query.bool = { should }
            }
        // Otherwise fetch only future events
        } else {
            query.range = { 'dates.end': { gte: 'now/d' } }
        }
        // Query the API and sort by date
        return api('events').query({
            sort: '[("dates.start",1)]',
            embedded: { files: 1 },
            source: JSON.stringify({
                query,
                filter,
            }),
        })
    }
}

/**
 * Action Dispatcher to fetch events from the server,
 * and add them to the store without adding them to the events list
 * @param {array} ids - An array of Event IDs to fetch
 * @return arrow function
 */
export function silentlyFetchEventsById(ids=[]) {
    return (dispatch) => (
        dispatch(performFetchQuery({ ids }))
        .then(data => dispatch(receiveEvents(data._items)))
    )
}

/**
 * Action Dispatcher to fetch events from the server
 * This will add the events to the events list,
 * and update the URL for deep linking
 * @param {object} params - Query parameters to send to the server
 * @return arrow function
 */
export function fetchEvents(params={}) {
    return (dispatch, getState, { $timeout, $location }) => {
        dispatch({
            type: 'REQUEST_EVENTS',
            payload: params,
        })
        dispatch(performFetchQuery(params))
        .then(data => {
            dispatch(receiveEvents(data._items))
            dispatch(setEventsList(data._items.map((e) => e._id)))
        })
        // update the url (deep linking)
        .then(() => $timeout(() => (
            $location.search('searchEvent', JSON.stringify(params)), 0, false)
        ))
    }
}

/**
 * Action to set the list of events in the current list
 * @param {array} idsList - An array of Event IDs to assign to the current list
 * @return object
 */
function setEventsList(idsList) {
    return {
        type: 'SET_EVENTS_LIST',
        payload: idsList,
    }
}

/**
 * Action to add events to the current list
 * This action makes sure the list of events are unique, no duplicates
 * @param {array} eventsIds - An array of Event IDs to add
 * @return {{type: string, payload: *}}
 */
export function addToEventsList(eventsIds) {
    return {
        type: 'ADD_TO_EVENTS_LIST',
        payload: eventsIds,
    }
}

/**
 * Action to open Event Advanced Search panel
 * @return object
 */
export function openAdvancedSearch() {
    return { type: 'OPEN_ADVANCED_SEARCH' }
}

/**
 * Action to close the Event Advanced Search panel
 * @return object
 */
export function closeAdvancedSearch() {
    return { type: 'CLOSE_ADVANCED_SEARCH' }
}

/**
 * Action to open the Edit Event panel
 * @param {object} event - The Event ID to edit
 * @return {{type: string, payload: *}}
 */
export function openEventDetails(event) {
    return {
        type: 'OPEN_EVENT_DETAILS',
        payload: get(event, '_id', event || true),
    }
}

/**
 * Action to close the Edit Event panel
 * @return object
 */
export function closeEventDetails() {
    return { type: 'CLOSE_EVENT_DETAILS' }
}

/**
 * Action to receive the list of Events and store them in the store
 * @param {array} events - An array of Event items
 * @return object
 */
export function receiveEvents(events) {
    return {
        type: 'ADD_EVENTS',
        payload: events,
        receivedAt: Date.now(),
    }
}

/**
 * Action to toggle the Events panel
 * @return object
 */
export function toggleEventsList() {
    return { type: 'TOGGLE_EVENT_LIST' }
}

/**
 * Action to display the Delete Event modal
 * @param {object} event - The event to display in the Delete Event modal
 * @return arrow function
 */
export const openDeleteEvent = (event) => (
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
                body: React.createElement(DeleteEvent, { eventDetail: eventWithPlannings }),
                action: () => dispatch(deleteEvent(eventWithPlannings)),
            },
        }))
    }
)
