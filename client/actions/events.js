import { pickBy, cloneDeep, get, isEmpty, isNil } from 'lodash'
import moment from 'moment-timezone'
import * as selectors from '../selectors'
import { SubmissionError } from 'redux-form'
import { saveLocation as _saveLocation } from './index'
import { showModal, hideModal, fetchSelectedAgendaPlannings, closePlanningEditor } from './index'
import { SpikeEvent } from '../components/index'
import React from 'react'
import { PRIVILEGES, EVENTS, ITEM_STATE } from '../constants'
import { checkPermission, getErrorMessage } from '../utils'

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
 * Action dispatcher that marks an Event as spiked
 * @param {object} event - The Event to be spiked
 * @return Promise
 */
const spikeEvent = (event) => (
    (dispatch, getState, { api, notify }) => (
        api.update('events_spike', event, {})
        .then(() => {
            notify.success('The Event has been spiked.')
            dispatch({
                type: EVENTS.ACTIONS.SPIKE_EVENT,
                payload: event,
            })

            // Close delete event modal
            dispatch(hideModal())

            // Close the Planning Editor if the Planning Item is
            // associated with this event
            if (event._plannings) {
                const planIds = event._plannings.map((p) => p._id)
                const currentPlanId = selectors.getCurrentPlanningId(getState())
                if (planIds.indexOf(currentPlanId) > -1) {
                    dispatch(closePlanningEditor())
                }
            }

            // Fetch events to reload latest events list
            return dispatch(silentlyFetchEventsById([event._id], ITEM_STATE.ALL))
            .then(() => {
                dispatch(fetchSelectedAgendaPlannings())
                dispatch(refetchEvents())
            })

        }, (error) => (
            notify.error(
                getErrorMessage(error, 'There was a problem, Event was not spiked!')
            )
        ))
    )
)

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
            return dispatch(silentlyFetchEventsById([event._id], ITEM_STATE.ALL))
            .then(() => {
                dispatch(refetchEvents())
            })
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
 * Also adds the user timezone, and notify the form to reset and hide the modal
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
)

/**
 * Action Dispatcher for query the api for events
 * You can provide one of the following parameters to fetch from the server
 * @param {object} advancedSearch - Query parameters to send to the server
 * @param {object} fulltext - Full text search parameters
 * @param {array} ids - An array of Event IDs to fetch
 * @param {string} state - The item state to filter by
 * @return arrow function
 */
const performFetchQuery = ({ advancedSearch, fulltext, ids, page=1, state=ITEM_STATE.ACTIVE }) => (
    (dispatch, getState, { api }) => {
        let query = {}
        const filter = {}
        let mustNot = []
        let must = []

        // If there is a fulltext, search by term
        if (fulltext) {
            must.push({ query_string: { query: fulltext } })
        // search by ids
        } else if (ids) {
            const chunkSize = EVENTS.FETCH_IDS_CHUNK_SIZE
            if (ids.length <= chunkSize) {
                must.push({ terms: { _id: ids } })
            } else {
                // chunk the requests
                const requests = []
                for (var i = 0; i < Math.ceil(ids.length / chunkSize); i++) {
                    const args = {
                        ...arguments[0],
                        ids: ids.slice(i * chunkSize, (i + 1) * chunkSize),
                    }
                    requests.push(dispatch(performFetchQuery(args)))
                }
                // flattern responses and return a response-like object
                return Promise.all(requests).then((responses) => (
                    { _items: Array.prototype.concat(...responses.map((r) => r._items)) }
                ))
            }
        // advanced search
        } else if (advancedSearch) {
            [
                {
                    condition: () => (advancedSearch.name),
                    do: () => {
                        must.push({ query_string: { query: advancedSearch.name } })
                    },
                },
                {
                    condition: () => (advancedSearch.source),
                    do: () => {
                        const providers = advancedSearch.source.map((provider) => provider.name)
                        const queries = providers.map((provider) => (
                            { term: { source: provider } }
                        ))
                        must.push(...queries)
                    },
                },
                {
                    condition: () => (advancedSearch.location),
                    do: () => {
                        must.push(
                            { term: { 'location.name': advancedSearch.location } }
                        )
                    },
                },
                {
                    condition: () => (advancedSearch.anpa_category),
                    do: () => {
                        const codes = advancedSearch.anpa_category.map((cat) => cat.qcode)
                        const queries = codes.map((code) => (
                            { term: { 'anpa_category.qcode': code } }
                        ))
                        must.push(...queries)
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
        // Otherwise fetch only future events
        } else {
            filter.range = { 'dates.end': { gte: 'now/d' } }
        }

        switch (state) {
            case ITEM_STATE.SPIKED:
                must.push({ term: { state: ITEM_STATE.SPIKED } })
                break
            case ITEM_STATE.ALL:
                break
            case ITEM_STATE.ACTIVE:
            default:
                mustNot.push({ term: { state: ITEM_STATE.SPIKED } })
        }

        query.bool = {
            must_not: mustNot,
            must,
        }

        // Query the API and sort by date
        return api('events').query({
            page: page,
            sort: '[("dates.start",1)]',
            embedded: { files: 1 },
            source: JSON.stringify({
                query,
                filter,
            }),
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
        dispatch(performFetchQuery({
            // distinct ids
            ids: ids.filter((v, i, a) => (a.indexOf(v) === i)),
            state,
        }))
        .then(data => {
            dispatch(receiveEvents(data._items))
            return data
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

        return dispatch(performFetchQuery(params))
        .then(data => {
            dispatch(receiveEvents(data._items))
            dispatch(setEventsList(data._items.map((e) => e._id)))
            // update the url (deep linking)
            $timeout(() => (
                $location.search('searchEvent', JSON.stringify(params)), 0, false)
            )
            return data
        })
    }
)

/**
 * Action Dispatcher to re-fetch the current list of events
 * It achieves this by performing a fetch using the params from
 * the store value `events.lastRequestParams`
 */
const refetchEvents = () => (
    (dispatch, getState) => (
        dispatch({
            type: EVENTS.ACTIONS.REQUEST_EVENTS,
            payload: selectors.getPreviousEventRequestParams(getState()),
        })
    )
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
        return dispatch(performFetchQuery(params))
        .then(data => {
            dispatch(receiveEvents(data._items))
            dispatch(addToEventsList(data._items.map((e) => e._id)))
        })
    }
}

/**
 * Action to set the list of events in the current list
 * @param {array} idsList - An array of Event IDs to assign to the current list
 * @return object
 */
const setEventsList = (idsList) => ({
    type: EVENTS.ACTIONS.SET_EVENTS_LIST,
    payload: idsList,
})

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
 * Opens the Edit Event panel with the supplied Event
 * @param {object} event - The Event ID to edit
 * @return Promise
 */
const _openEventDetails = (event) => ({
    type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
    payload: get(event, '_id', event || true),
})

/**
 * Action to close the Edit Event panel
 * @return object
 */
const closeEventDetails = () => (
    { type: EVENTS.ACTIONS.CLOSE_EVENT_DETAILS }
)

/**
 * Action to receive the list of Events and store them in the store
 * @param {array} events - An array of Event items
 * @return object
 */
const receiveEvents = (events) => ({
    type: EVENTS.ACTIONS.ADD_EVENTS,
    payload: events,
    receivedAt: Date.now(),
})

/**
 * Action to toggle the Events panel
 * @return object
 */
const toggleEventsList = () => (
    { type: EVENTS.ACTIONS.TOGGLE_EVENT_LIST }
)

/**
 * Action Dispatcher to open the Spike Event modal
 * @param {object} event - The Event to be spiked
 */
const _openSpikeEvent = (event) => (
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
                action: () => dispatch(spikeEvent(eventWithPlannings)),
            },
        }))
    }
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

const openSpikeEvent = checkPermission(
    _openSpikeEvent,
    PRIVILEGES.SPIKE_EVENT,
    'Unauthorised to spike an event!'
)

const openUnspikeEvent = checkPermission(
    _openUnspikeEvent,
    PRIVILEGES.UNSPIKE_EVENT,
    'Unauthorised to unspike an event!'
)

export {
    spikeEvent,
    unspikeEvent,
    openSpikeEvent,
    openUnspikeEvent,
    toggleEventsList,
    receiveEvents,
    closeEventDetails,
    openEventDetails,
    closeAdvancedSearch,
    openAdvancedSearch,
    addToEventsList,
    fetchEvents,
    silentlyFetchEventsById,
    saveFiles,
    uploadFilesAndSaveEvent,
    loadMoreEvents,
    refetchEvents,
}
