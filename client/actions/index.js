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
        original = original ? Object.assign({}, original) : {}
        return api('events').save(original, newEvent)
        .then(data => dispatch(addEvent(data)))
        .then(() => dispatch({ type: 'EVENT_SAVE_SUCCESS' }))
        .then(dispatch(hideModal()))
    }
)
export const fetchEvents = () => (
    (dispatch, getState, { api }) => {
        dispatch(requestEvents())
        return api('events').query({ sort: '[("dates.start",1)]' })
        .then(data => dispatch(receiveEvents(data._items)))
    }
)
// MODAL
export const showModal = ({ modalType, modalProps }) => ({
    type: 'SHOW_MODAL', modalType, modalProps
})
export const hideModal = () => ({
    type: 'HIDE_MODAL'
})
