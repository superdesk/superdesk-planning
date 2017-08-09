import * as selectors from '../../selectors'
import { showModal } from '../index'
import eventsApi from './api'

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

const self = {
    onEventLocked,
    onEventUnlocked,
}

// Map of notification name and Action Event to execute
self.events = {
    'events:lock': () => (self.onEventLocked),
    'events:unlock': () => (self.onEventUnlocked),
}

export default self
