import { pickBy, cloneDeep, get, isEmpty, isNil } from 'lodash'
import moment from 'moment-timezone'
import * as selectors from '../selectors'
import { SubmissionError } from 'redux-form'
import { saveLocation as _saveLocation } from './index'

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

            // If event was just created, open it in editing mode
            // Otherwise, if saved again, event gets saved as new one
            if (events.length > 0 && selectors.getShowEventDetails(getState()) === true) {
                dispatch(openEventDetails(events[0]._id))
            }
        })
    )
}

function saveFiles(newEvent) {
    const getId = (e) => (e._id)
    const getIds = (e) => (e.map(getId))
    return (dispatch, getState, { upload }) => (
        new Promise((resolve) => {
            // upload files and link them to the event
            if ((newEvent.files || []).length > 0) {
                const fileFiles = newEvent.files.filter(
                    (f) => ((f instanceof FileList && f.length) || f instanceof Array)
                )
                if (fileFiles.length) {
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
                    .then((newEvent) => resolve(newEvent))
                } else {
                    delete newEvent.files
                    return resolve(newEvent)
                }
            } else {
                return resolve(newEvent)
            }
        })
    )
}

function saveLocation(event) {
    return (dispatch) => {
        // location field was empty, we clear the location
        if (get(event, 'location[0].name') === '') {
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

/** Add the user timezone, save the event, notify the form (to reset) and hide the modal */
function saveEvent(newEvent) {
    return (dispatch, getState, { api }) => {
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
        .then(data => data._items || [data],
        (error) => {
            throw new SubmissionError({ _error: error.statusText })
        })
    }
}

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

/** This will fetch events and adds them to the store,
    without addign them to the events list */
export function silentlyFetchEventsById(ids=[]) {
    return (dispatch) => (
        dispatch(performFetchQuery({ ids }))
        .then(data => dispatch(receiveEvents(data._items)))
    )
}

/** Fetch events from a user request, like a search.
    This will add the events to the events list
    And update the URL for deep linking */
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

function setEventsList(idsList) {
    return {
        type: 'SET_EVENTS_LIST',
        payload: idsList,
    }
}

export function addToEventsList(eventsIds) {
    return {
        type: 'ADD_TO_EVENTS_LIST',
        payload: eventsIds,
    }
}

export function openAdvancedSearch() {
    return { type: 'OPEN_ADVANCED_SEARCH' }
}

export function closeAdvancedSearch() {
    return { type: 'CLOSE_ADVANCED_SEARCH' }
}

export function openEventDetails(event) {
    return {
        type: 'OPEN_EVENT_DETAILS',
        payload: get(event, '_id', event || true),
    }
}

export function closeEventDetails() {
    return { type: 'CLOSE_EVENT_DETAILS' }
}

export function receiveEvents(events) {
    return {
        type: 'ADD_EVENTS',
        payload: events,
        receivedAt: Date.now(),
    }
}

export function toggleEventsList() {
    return { type: 'TOGGLE_EVENT_LIST' }
}
