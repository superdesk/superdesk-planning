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
        return api('events').query({ sort: '[("dates.start",1)]' })
        .then(data => dispatch(receiveEvents(data._items)))
    }
)
