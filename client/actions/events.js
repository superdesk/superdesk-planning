import { pickBy, cloneDeep, get, isEmpty, isNil } from 'lodash'
import moment from 'moment-timezone'
import * as selectors from '../selectors'
import { SubmissionError } from 'redux-form'
import { saveLocation } from './index'

export const receiveEvents = (events) => ({
    type: 'RECEIVE_EVENTS',
    payload: events,
    receivedAt: Date.now(),
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
            dispatch(_fetchEvents({ ids: incompleteEvents.map((i) => (i._id)) }))
            .then((e) => {
                dispatch({
                    type: 'ADD_EVENTS',
                    payload: e._items,
                })
            })
        } else {
            dispatch({
                type: 'ADD_EVENTS',
                payload: events,
            })
        }
    }
}

function uploadFiles(files) {
    return (dispatch, getState, { upload }) => (
        Promise.all(files.map((file) => (
            upload.start({
                method: 'POST',
                url: getState().config.server.url + '/events_files/',
                headers: { 'Content-Type': 'multipart/form-data' },
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
    newEvent = cloneDeep(newEvent) || {}
    return (dispatch) => (
        Promise.resolve((() => {
            // Remove empty event links
            if (newEvent.links && newEvent.links.length > 0) {
                newEvent.links = newEvent.links.filter((l) => (l))
                if (!newEvent.links.length) {
                    delete newEvent.links
                }
            }

            if (get(newEvent, 'location[0]') && isNil(newEvent.location[0].qcode)) {
                return dispatch(saveLocation(newEvent.location[0]))
                .then((location) => {
                    newEvent.location[0] = location
                    return newEvent
                })
            } else {
                return newEvent
            }
        })())
        .then((newEvent) => {
            // upload files and link them to the event
            if ((newEvent.files || []).length > 0) {
                const fileFiles = newEvent.files.filter(
                    (f) => ((f instanceof FileList && f.length) || f instanceof Array)
                )
                if (fileFiles.length)
                {
                    return dispatch(uploadFiles(fileFiles))
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
                } else {
                    delete newEvent.files
                    return newEvent
                }
            } else {
                return newEvent
            }
        })
        .then((newEvent) => dispatch(saveEvent(newEvent)))
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
            dispatch(closeEventDetails())
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

export function fetchEvents(params={}) {
    return (dispatch, getState, { $timeout, $location }) => {
        dispatch({
            type: 'REQUEST_EVENTS',
            payload: params,
        })
        dispatch(_fetchEvents(params))
        .then(data => dispatch(receiveEvents(data._items)))
        // update the url (deep linking)
        .then(() => $timeout(() => (
            $location.search('searchEvent', JSON.stringify(params)), 0, false)
        ))
    }
}

export const openAdvancedSearch = () => (
    { type: 'OPEN_ADVANCED_SEARCH' }
)

export const closeAdvancedSearch = () => (
    { type: 'CLOSE_ADVANCED_SEARCH' }
)

export const openEventDetails = (event) => (
    {
        type: 'OPEN_EVENT_DETAILS',
        payload: get(event, '_id', event || true),
    }
)

export const closeEventDetails = () => (
    { type: 'CLOSE_EVENT_DETAILS' }
)
