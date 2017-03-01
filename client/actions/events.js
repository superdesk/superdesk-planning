import { hideModal } from './modal'
import { pickBy, cloneDeep } from 'lodash'
import moment from 'moment-timezone'
import * as selectors from '../selectors'
import { SubmissionError } from 'redux-form'

export const receiveEvents = (events) => ({
    type: 'RECEIVE_EVENTS',
    payload: events,
    receivedAt: Date.now()
})

export function toggleEventsList() {
    return { type: 'TOGGLE_EVENT_LIST' }
}

export function addEvents(events) {
    return (dispatch) => {
        const incompleteEvents = events.filter((e) => (
            e.files && e.files.length > 0 && typeof e.files[0] === 'string'
        ))
        if (incompleteEvents.length > 0) {
            dispatch(_fetchEvents({
                ids: incompleteEvents.map((i) => (i._id))
            }))
            .then((e) => {
                dispatch({ type: 'ADD_EVENTS', payload: e._items })
            })
        } else {
            dispatch({ type: 'ADD_EVENTS', payload: events })
        }
    }
}

function uploadFiles(files) {
    return (dispatch, getState, { upload }) => (
        Promise.all(files.map((file) => (
            upload.start({
                method: 'POST',
                url: getState().config.server.url + '/events_files/',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                data: { media: [file] },
                arrayKey: '',
                // returns the item
            }).then((d) => (d.data))
        )))
    )
}

export function uploadFilesAndSaveEvent(newEvent) {
    const getId = (e) => (e._id)
    const getIds = (e) => (e.map(getId))
    return (dispatch) => (
        // upload files and link them to the event
        Promise.resolve((() => {
            newEvent = cloneDeep(newEvent) || {}
            if ((newEvent.files || []).length > 0) {
                const fileFiles = newEvent.files.filter(
                    (f) => (f instanceof FileList || f instanceof Array)
                )
                return dispatch(uploadFiles(fileFiles))
                .then((uploadedFiles) => {
                    newEvent.files = [
                        // reference uploaded files to event
                        ...getIds(uploadedFiles),
                        // remove uploaded FileList objects
                        ...getIds(newEvent.files.filter((f) => (
                            fileFiles.indexOf(f) === -1
                        ))),
                    ]
                })
            }
        })())
        .then(() => dispatch(saveEvent(newEvent)))
    )
}

/** Add the user timezone, save the event, notify the form (to reset) and hide the modal */
function saveEvent(newEvent) {
    return (dispatch, getState, { api }) => {
        // retrieve original
        let original = selectors.getEvents(getState()).find((e) => e._id === newEvent._id)
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
        // add the event to the store
        .then(data => {
            dispatch(addEvents(data._items || [data]))
            // notify the end of the action and reset the form
            dispatch({ type: 'EVENT_SAVE_SUCCESS' })
            // hide the modal
            dispatch(hideModal())
            return data
        }, (error) => {
            throw new SubmissionError({ _error: error.statusText })
        })
    }
}

function _fetchEvents({ advancedSearch, fulltext, ids }) {
    return (dispatch, getState, { api }) => {
        const query = {}
        const filter = {}
        // If there is a fulltext, search by term
        if (fulltext) {
            query.bool = { should: [
                { match: { name: fulltext } },
                { match: { definition_short: fulltext } },
            ] }
        // search by ids
        } else if (ids) {
            filter.bool = {
                should: ids.map((i) => ({ term: { _id: i } }))
            }
        // advanced search
        } else if (advancedSearch) {
            const should = []
            const range = {}
            // by name
            if (advancedSearch.name) {
                should.push(
                    { match: { name: advancedSearch.name } },
                    { match: { definition_short: advancedSearch.name } }
                )
            }
            // by location
            if (advancedSearch.location) {
                should.push(
                    { match: { 'location.name': advancedSearch.location } },
                    { match: { 'location.qcode': advancedSearch.location } }
                )
            }
            // by dates
            if (advancedSearch.dates) {
                if (advancedSearch.dates.start) {
                    range['dates.start'] = { gte: advancedSearch.dates.start }
                }

                if (advancedSearch.dates.end) {
                    range['dates.end'] = { lte: advancedSearch.dates.end }
                }

                filter.range = range
            }
            // build the query
            if (should.length > 0) {
                query.bool = { should }
            }
        // Otherwise fetch only future events
        } else {
            query.range = { 'dates.start': { gte: 'now/d' } }
        }
        // Query the API and sort by date
        return api('events').query({
            sort: '[("dates.start",1)]',
            embedded: { files: 1 },
            source: JSON.stringify({ query, filter })
        })
    }
}

export function fetchEvents(params={}) {
    return (dispatch, getState, { $timeout, $location }) => {
        dispatch({ type: 'REQUEST_EVENTS', payload: params })
        dispatch(_fetchEvents(params))
        .then(data => dispatch(receiveEvents(data._items)))
        // update the url (deep linking)
        .then(() => $timeout(() => ($location.search('searchEvent', JSON.stringify(params)))))
    }
}

export const openAdvancedSearch = () => (
    { type: 'OPEN_ADVANCED_SEARCH' }
)

export const closeAdvancedSearch = () => (
    { type: 'CLOSE_ADVANCED_SEARCH' }
)
