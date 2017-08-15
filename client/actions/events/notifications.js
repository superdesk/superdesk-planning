import * as selectors from '../../selectors'
import { WORKFLOW_STATE } from '../../constants'
import { showModal } from '../index'
import eventsApi from './api'
import eventsUi from './ui'

/**
 * Action Event when an Event gets unlocked
 * @param _e
 * @param {object} data - Event and User IDs
 */
const onEventUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const event = selectors.getShowEventDetails(getState())
            // If this is the event currently being edited, show popup notification
            if (event === data.item &&
                data.user !== selectors.getSessionDetails(getState).identity._id &&
                selectors.isEventDetailLockedInThisSession(getState())) {
                const user =  selectors.getUsers(getState()).find((u) => u._id === data.user)
                dispatch(showModal({
                    modalType: 'NOTIFICATION_MODAL',
                    modalProps: {
                        title: 'Item Unlocked',
                        body: 'The event you were editing was unlocked by \"' +
                            user.display_name + '\"',
                    },
                }))
            }

            let eventInStore = selectors.getEvents(getState())[data.item]
            eventInStore = {
                ...eventInStore,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                _etag: data.etag,
            }

            dispatch(eventsApi.receiveEvents([eventInStore]))
        }
    }
)

const onEventLocked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            let eventInStore = selectors.getEvents(getState())[data.item]
            eventInStore = {
                ...eventInStore,
                lock_action: 'edit',
                lock_user: data.user,
                lock_session: data.lock_session,
                lock_time: data.lock_time,
                _etag: data.etag,
            }
            dispatch(eventsApi.receiveEvents([eventInStore]))
        }
    }
)

const onEventSpiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            // Just update the event in store with updates and etag
            let eventInStore = selectors.getEvents(getState())[data.item]
            eventInStore = {
                ...eventInStore,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                state: WORKFLOW_STATE.SPIKED,
                revert_state: data.revert_state,
                _etag: data.etag,
            }

            // Update the event in store
            dispatch(eventsApi.receiveEvents([eventInStore]))

            // Update the event list
            let newList = selectors.getEventsIdsToShowInList(getState())
            newList.splice(newList.indexOf(data.item), 1)
            dispatch(eventsUi.setEventsList(newList))
        }
    }

)

const self = {
    onEventLocked,
    onEventUnlocked,
    onEventSpiked,
}

// Map of notification name and Action Event to execute
self.events = {
    'events:lock': () => (self.onEventLocked),
    'events:unlock': () => (self.onEventUnlocked),
    'events:spiked': () => (self.onEventSpiked),
}

export default self
