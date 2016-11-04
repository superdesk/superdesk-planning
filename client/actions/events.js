import { hideModal } from './modal'
import { pickBy } from 'lodash'
import moment from 'moment'

const receiveEvents = (events) => ({
    type: 'RECEIVE_EVENTS',
    events,
    receivedAt: Date.now()
})
const requestEvents = () => ({
    type: 'REQUEST_EVENTS'
})
export const addEvent = (event) => ({
    type: 'ADD_EVENT', event
})
export const saveEvent = (newEvent) => (
    (dispatch, getState, { api }) => {
        let events = getState().events
        // retrieve original
        let original = events.find((e) => e._id === newEvent._id)
        // clone the original because `save` will modify it
        original = original ? Object.assign({}, original) : {}
        newEvent = newEvent ? Object.assign({}, newEvent) : {}
        // remove all properties starting with _,
        // otherwise it will fail for "unknown field" with `_type`
        newEvent = pickBy(newEvent, (v, k) => (!k.startsWith('_')))
        // save UTC time zone
        newEvent.dates.start = moment.utc(newEvent.dates.start)
        newEvent.dates.end = moment.utc(newEvent.dates.end)
        return api('events').save(original, newEvent)
        // add the event to the store
        .then(data => {
            dispatch(addEvent(data))
            // notify the end of the action and reset the form
            dispatch({ type: 'EVENT_SAVE_SUCCESS' })
            // hide the modal
            return dispatch(hideModal())
        })
    }
)
export const fetchEvents = () => (
    (dispatch, getState, { api }) => {
        dispatch(requestEvents())
        let futureEvent = { query: { range: { 'dates.start': { gte: 'now/d' } } } }
        return api('events').query({
            sort: '[("dates.start",1)]',
            source: JSON.stringify(futureEvent)
        })
        .then(data => dispatch(receiveEvents(data._items)))
    }
)
