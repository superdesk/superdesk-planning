import { hideModal } from './modal'
import { pickBy } from 'lodash'
import moment from 'moment-timezone'

const receiveEvents = (events) => ({
    type: 'RECEIVE_EVENTS',
    events,
    receivedAt: Date.now()
})

export function addEvents(events) {
    return { type: 'ADD_EVENTS', events }
}

/** Add the user timezone, save the event, notify the form (to reset) and hide the modal */
export function saveEvent(newEvent) {
    return (dispatch, getState, { api }) => {
        let events = getState().events
        // retrieve original
        let original = events.find((e) => e._id === newEvent._id)
        // clone the original because `save` will modify it
        original = original ? JSON.parse(JSON.stringify(original)) : {}
        newEvent = newEvent ? JSON.parse(JSON.stringify(newEvent)) : {}
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
            return dispatch(hideModal())
        })
    }
}

export function fetchEvents(keyword) {
    return (dispatch, getState, { api }) => {
        dispatch({ type: 'REQUEST_EVENTS' })
        const query = {}
        // If there is a keyword, search by term
        if (keyword) {
            query.bool = { should: [
                { match: { name: keyword } },
                { match: { definition_short: keyword } },
            ] }
        // Otherwise fetch only future events
        } else {
            query.range = { 'dates.start': { gte: 'now/d' } }
        }
        // Query the API and sort by date
        return api('events').query({
            sort: '[("dates.start",1)]',
            source: JSON.stringify({ query: query })
        })
        .then(data => dispatch(receiveEvents(data._items)))
    }
}
