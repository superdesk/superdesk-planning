import { EVENTS, SPIKED_STATE, WORKFLOW_STATE } from '../../constants'
import { EventUpdateMethods } from '../../components/fields'
import { get, isEqual, cloneDeep } from 'lodash'
import * as selectors from '../../selectors'
import moment from 'moment'

import planningApi from '../planning/api'

/**
 * Action dispatcher to load a series of recurring events into the local store.
 * This does not update the list of visible Events
 * @param rid
 * @param spikeState
 */
const loadEventsByRecurrenceId = (rid, spikeState = SPIKED_STATE.BOTH, page=1, maxResults=25) => (
    (dispatch) => (
        dispatch(self.query({
            recurrenceId: rid,
            spikeState,
            page,
            maxResults,
        }))
        .then((data) => {
            dispatch(self.receiveEvents(data._items))
            return Promise.resolve(data._items)
        }, (error) => (
            Promise.reject(error)
        ))
    )
)

/**
 * Action dispatcher to mark an Event as spiked using the API.
 * @param {Array} events - An Array of Events to be spiked
 */
const spike = (events) => (
    (dispatch, getState, { api }) => {
        if (!Array.isArray(events)) {
            events = [events]
        }

        return Promise.all(
            events.map((event) => {
                event.update_method = get(event, 'update_method.value', EventUpdateMethods[0].value)
                return api.update(
                    'events_spike',
                    event,
                    { update_method: event.update_method }
                )
            })
        )
        .then(() => {
            dispatch({
                type: EVENTS.ACTIONS.SPIKE_EVENT,
                payload: events.map((event) => event._id),
            })
            return Promise.resolve(events)
        }, (error) => (Promise.reject(error)))
    }
)

const unspike = (events) => (
    (dispatch, getState, { api }) => {
        if (!Array.isArray(events)) {
            events = [events]
        }

        return Promise.all(
            events.map((event) => api.update('events_unspike', event, {}))
        )
        .then(() => {
            dispatch({
                type: EVENTS.ACTIONS.UNSPIKE_EVENT,
                payload: events.map((event) => event._id),
            })
            return Promise.resolve(events)
        }, (error) => (Promise.reject(error)))
    }
)

/**
 * Action Dispatcher for query the api for events
 * You can provide one of the following parameters to fetch from the server
 * @param {object} advancedSearch - Query parameters to send to the server
 * @param {object} fulltext - Full text search parameters
 * @param {Array} ids - An array of Event IDs to fetch
 * @param {string} recurrenceId - The recurrence_id to fetch recurring events
 * @param {date} startDateGreaterThan - Start date range
 * @param {int} page - The page number to fetch
 * @param {string} state - The item state to filter by
 * @return arrow function
 */
const query = (
    {
        advancedSearch={},
        fulltext,
        ids,
        recurrenceId,
        startDateGreaterThan,
        page=1,
        maxResults=25,
        spikeState=SPIKED_STATE.NOT_SPIKED,
    }
) => (
    (dispatch, getState, { api }) => {
        let query = {}
        const filter = {}
        let mustNot = []
        let must = []

        if (ids) {
            const chunkSize = EVENTS.FETCH_IDS_CHUNK_SIZE
            if (ids.length <= chunkSize) {
                must.push({ terms: { _id: ids } })
            } else {
                // chunk the requests
                const requests = []
                for (let i = 0; i < Math.ceil(ids.length / chunkSize); i++) {
                    const args = {
                        ...arguments[0],
                        ids: ids.slice(i * chunkSize, (i + 1) * chunkSize),
                    }
                    requests.push(dispatch(self.query(args)))
                }
                // flattern responses and return a response-like object
                return Promise.all(requests).then((responses) => (
                    { _items: Array.prototype.concat(...responses.map((r) => r._items)) }
                ))
            }
        }
        // List of actions to perform if the condition is true
        [
            {
                condition: () => (fulltext),
                do: () => {
                    must.push({ query_string: { query: fulltext } })
                },
            },
            {
                condition: () => (recurrenceId),
                do: () => {
                    must.push({ term: { recurrence_id: recurrenceId } })
                },
            },
            {
                condition: () => (startDateGreaterThan),
                do: () => {
                    filter.range = {
                        ...get(filter, 'range', {}),
                        'dates.start': { gt: startDateGreaterThan },
                    }
                },
            },
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
                condition: () => (advancedSearch.calendars),
                do: () => {
                    const codes = advancedSearch.calendars.map((cat) => cat.qcode)
                    const queries = codes.map((code) => (
                        { term: { 'calendars.qcode': code } }
                    ))
                    must.push(...queries)
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
                condition: () => (advancedSearch.subject),
                do: () => {
                    const codes = advancedSearch.subject.map((sub) => sub.qcode)
                    const queries = codes.map((code) => (
                        { term: { 'subject.qcode': code } }
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

        // default filter
        if (isEqual(filter, {}) && isEqual(must, []) && isEqual(mustNot, [])) {
            filter.range = { 'dates.end': { gte: 'now/d' } }
        }

        switch (spikeState) {
            case SPIKED_STATE.SPIKED:
                must.push({ term: { state: WORKFLOW_STATE.SPIKED } })
                break
            case SPIKED_STATE.BOTH:
                break
            case SPIKED_STATE.NOT_SPIKED:
            default:
                mustNot.push({ term: { state: WORKFLOW_STATE.SPIKED } })
        }

        query.bool = {
            must,
            must_not: mustNot,
        }

        // Query the API and sort by date
        return api('events').query({
            page,
            max_results: maxResults,
            sort: '[("dates.start",1)]',
            embedded: { files: 1 },
            source: JSON.stringify({
                query,
                filter,
            }),
        })
        // convert dates to moment objects
        .then((data) => ({
            ...data,
            _items: data._items.map((item) => ({
                ...item,
                dates: {
                    ...item.dates,
                    start: moment(item.dates.start),
                    end: moment(item.dates.end),
                },
            })),
        }))
    }
)

/**
 * Action Dispatcher to re-fetch the current list of events
 * It achieves this by performing a fetch using the params from
 * the store value `events.lastRequestParams`
 */
const refetchEvents = () => (
    (dispatch, getState) => {
        const prevParams = selectors.getPreviousEventRequestParams(getState())

        const promises = []
        for (let i = 1; i <= prevParams.page; i++) {
            const params = {
                ...prevParams,
                page: i,
            }
            dispatch({
                type: EVENTS.ACTIONS.REQUEST_EVENTS,
                payload: params,
            })
            promises.push(dispatch(self.query(params)))
        }

        return Promise.all(promises)
        .then((responses) => {
            let events = responses
                .map((e) => e._items)
                .reduce((a, b) => a.concat(b))

            dispatch(self.receiveEvents(events))
            return Promise.resolve(events)
        }, (error) => (Promise.reject(error)))
    }
)

/**
 * Action dispatcher to load all events from the series of events,
 * then load their associated planning items.
 * @param {object} event - Any event from the series of recurring events
 */
const loadRecurringEventsAndPlanningItems = (event) => (
    (dispatch, getState) => {
        // Make sure we're dealing with a recurring event
        if (!get(event, 'recurrence_id')) {
            return Promise.reject('Supplied event is not a recurring event!')
        }

        // Clone the original so that we can modify its contents
        const eventDetail = cloneDeep(event)

        // Load all of the events from the series
        return dispatch(self.loadEventsByRecurrenceId(
            eventDetail.recurrence_id,
            SPIKED_STATE.BOTH,
            1,
            200
        ))
        .then((events) => {
            // Store the events, and an array of their ids
            eventDetail._recurring = {
                events,
                ids: events.map((e) => (e._id)),
            }

            // Load all the Planning items from all events in the series
            return dispatch(planningApi.loadPlanningByEventId(
                eventDetail._recurring.ids
            ))
            .then((items) => {
                // Map the list of Agendas to each Planning item
                const agendas = selectors.getAgendas(getState())
                items = items.map((p) => ({
                    ...p,
                    _agendas: !p.agendas ? [] : p.agendas.map((id) =>
                        agendas.find((agenda) => agenda._id === id)
                    ),
                }))

                // Store the associated planning items with the event
                eventDetail._recurring.plannings = items
                eventDetail._plannings = items.filter((p) => (p.event_item === eventDetail._id))

                // Return the newly created event object
                return Promise.resolve(eventDetail)
            }, (error) => (Promise.reject(error)))
        }, (error) => (Promise.reject(error)))
    }
)

/**
 * Action to receive the list of Events and store them in the store
 * @param {Array} events - An array of Event items
 * @return object
 */
const receiveEvents = (events) => ({
    type: EVENTS.ACTIONS.ADD_EVENTS,
    payload: events,
    receivedAt: Date.now(),
})

const lock = (event) => (
    (dispatch, getState, { api, notify }) => (
        api('events_lock', event).save({}, { lock_action: 'edit' })
       .then(
        (item) => {
            // On lock, file object in the event is lost, so, replace it from original event
            item.files = event.files
            return item
        }, (error) => {
            const msg = get(error, 'data._message') || 'Could not lock the event.'
            notify.error(msg)
            if (error) throw error
        })
    )
)

const unlock = (event) => (
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
 * Action Dispatcher to fetch events from the server,
 * and add them to the store without adding them to the events list
 * @param {array} ids - An array of Event IDs to fetch
 * @param {string} spikeState - Event's spiked state (SPIKED, NOT_SPIKED or BOTH)
 * @return arrow function
 */
const silentlyFetchEventsById = (ids=[], spikeState = SPIKED_STATE.NOT_SPIKED) => (
    (dispatch) => (
        dispatch(self.query({
            // distinct ids
            ids: ids.filter((v, i, a) => (a.indexOf(v) === i)),
            spikeState,
        }))
        .then(data => {
            dispatch(self.receiveEvents(data._items))
            return Promise.resolve(data._items)
        }, (error) => (
            Promise.reject(error)
        ))
    )
)

const self = {
    loadEventsByRecurrenceId,
    spike,
    unspike,
    query,
    refetchEvents,
    receiveEvents,
    loadRecurringEventsAndPlanningItems,
    lock,
    unlock,
    silentlyFetchEventsById,
}

export default self
