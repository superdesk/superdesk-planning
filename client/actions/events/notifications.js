import * as selectors from '../../selectors'
import { WORKFLOW_STATE, EVENTS } from '../../constants'
import { showModal } from '../index'
import eventsApi from './api'
import eventsUi from './ui'
import { get } from 'lodash'

/**
 * Action Event when an Event gets unlocked
 * @param _e
 * @param {object} data - Event and User IDs
 */
const onEventUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const events = selectors.getEvents(getState())
            const currentEventId = selectors.getShowEventDetails(getState())

            // If this is the event currently being edited, show popup notification
            if (currentEventId === data.item &&
                data.lock_session !== selectors.getSessionDetails(getState()).sessionId &&
                selectors.isEventDetailLockedInThisSession(getState())
            ) {
                const user =  selectors.getUsers(getState()).find((u) => u._id === data.user)
                dispatch(showModal({
                    modalType: 'NOTIFICATION_MODAL',
                    modalProps: {
                        title: 'Item Unlocked',
                        body: 'The event you were editing was unlocked by "' +
                            user.display_name + '"',
                    },
                }))
            }

            let eventInStore = get(events, data.item, {})
            eventInStore = {
                ...eventInStore,
                _id: data.item,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                _etag: data.etag,
            }

            dispatch({
                type: EVENTS.ACTIONS.UNLOCK_EVENT,
                payload: { event: eventInStore },
            })

            return Promise.resolve(eventInStore)
        }

        return Promise.resolve()
    }
)

const onEventLocked = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            return dispatch(eventsApi.getEvent(data.item, false))
            .then((eventInStore) => {
                eventInStore = {
                    ...eventInStore,
                    lock_action: data.lock_action || 'edit',
                    lock_user: data.user,
                    lock_session: data.lock_session,
                    lock_time: data.lock_time,
                    _etag: data.etag,
                }

                dispatch({
                    type: EVENTS.ACTIONS.LOCK_EVENT,
                    payload: { event: eventInStore },
                })

                return Promise.resolve(eventInStore)
            })
        }

        return Promise.resolve()
    }
)

const onEventSpiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            // Just update the event in store with updates and etag
            const events = selectors.getEvents(getState())

            let eventInStore = get(events, data.item, {})
            eventInStore = {
                ...eventInStore,
                _id: data.item,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                state: WORKFLOW_STATE.SPIKED,
                revert_state: data.revert_state,
                _etag: data.etag,
            }

            dispatch({
                type: EVENTS.ACTIONS.SPIKE_EVENT,
                payload: { event: eventInStore },
            })

            return Promise.resolve(eventInStore)
        }

        return Promise.resolve()
    }
)

const onEventUnspiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const events = selectors.getEvents(getState())

            let eventInStore = get(events, data.item, {})
            eventInStore = {
                ...eventInStore,
                _id: data.item,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                state: data.state,
                revert_state: null,
                _etag: data.etag,
            }

            dispatch({
                type: EVENTS.ACTIONS.UNSPIKE_EVENT,
                payload: { event: eventInStore },
            })

            return Promise.resolve(eventInStore)
        }

        return Promise.resolve()
    }
)

const onEventCancelled = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            let events = selectors.getEvents(getState())
            if (data.item in events) {
                dispatch(eventsApi.markEventCancelled(
                    events[data.item],
                    data.reason,
                    data.occur_status
                ))
            }
        }
    }
)

const onEventRescheduled = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(eventsUi.refetchEvents())
            dispatch(eventsApi.getEvent(data.item, false))
            .then((event) => (
                dispatch({
                    type: EVENTS.ACTIONS.UNLOCK_EVENT,
                    payload: { event },
                })
            ))
        }
    }
)

const onEventPostponed = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            let events = selectors.getEvents(getState())
            if (data.item in events) {
                dispatch(eventsApi.markEventPostponed(
                    events[data.item],
                    data.reason
                ))
            }
        }
    }
)

const self = {
    onEventLocked,
    onEventUnlocked,
    onEventSpiked,
    onEventUnspiked,
    onEventCancelled,
    onEventRescheduled,
    onEventPostponed,
}

// Map of notification name and Action Event to execute
self.events = {
    'events:lock': () => (self.onEventLocked),
    'events:unlock': () => (self.onEventUnlocked),
    'events:spiked': () => (self.onEventSpiked),
    'events:unspiked': () => (self.onEventUnspiked),
    'events:cancelled': () => (self.onEventCancelled),
    'events:rescheduled': () => (self.onEventRescheduled),
    'events:postponed': () => (self.onEventPostponed),
}

export default self
