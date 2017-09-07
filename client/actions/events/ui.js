import { showModal, hideModal } from '../index'
import { PRIVILEGES, EVENTS, GENERIC_ITEM_ACTIONS } from '../../constants'
import planning from '../planning'
import eventsApi from './api'
import { fetchSelectedAgendaPlannings } from '../agenda'
import * as selectors from '../../selectors'
import { get, last } from 'lodash'
import {
    checkPermission,
    getErrorMessage,
    isItemLockedInThisSession,
    isItemSpiked,
    isItemRescheduled,
} from '../../utils'

/**
 * Action to open the Edit Event panel with the supplied Event
 * @param {object} event - The Event ID to edit
 * @return Promise
 */
const _openEventDetails = (event) => (
    (dispatch, getState) => {
        const id = get(event, '_id')
        if (id) {
            const openDetails = {
                type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
                payload: id,
            }

            // In sessions with multiple tabs, state values of showEventDetails are different
            // So, explicitly get the event from the store and see if we hold the lock on it
            const eventInState = { ...selectors.getEvents(getState())[id] }
            if (eventInState && isItemLockedInThisSession(eventInState,
                    selectors.getSessionDetails(getState()))) {
                dispatch(openDetails)
                return Promise.resolve(eventInState)
            } else {
                if (isItemSpiked(eventInState)) {
                    dispatch(self.previewEvent(event))
                    return Promise.resolve(eventInState)
                }

                return dispatch(eventsApi.lock(event)).then((item) => {
                    dispatch(openDetails)
                    dispatch(eventsApi.receiveEvents([item]))
                    return item
                }, () => {
                    dispatch(openDetails)
                })
            }
        } else {
            dispatch({
                type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
                payload: true,
            })
            return Promise.resolve(event)
        }
    }
)

/**
 * If user has lock, opens event in edit. Otherwise previews it
 * @param {object} event - The Event ID to preview
 * @return Promise
 */
const previewEvent = (event) => (
    (dispatch, getState) => {
        const id = get(event, '_id')
        const eventInState = { ...selectors.getEvents(getState())[id] }
        if (eventInState && isItemLockedInThisSession(eventInState,
                selectors.getSessionDetails(getState()))) {
            dispatch({
                type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
                payload: id,
            })
        } else {
            dispatch(_previewEvent(event))
        }

        return Promise.resolve()
    }
)

/**
 * Action to close the Edit Event panel
 * @return Promise
 */
const closeEventDetails = () => (
    (dispatch, getState) => {
        if (selectors.isEventDetailLockedInThisSession(getState())) {
            const _event = selectors.getShowEventDetails(getState())
            dispatch(eventsApi.unlock({ _id: _event }))
        }

        dispatch({ type: EVENTS.ACTIONS.CLOSE_EVENT_DETAILS })
        return Promise.resolve()
    }
)

/**
 * Action to minimize the Edit Event panel
 * @return object
 */
const minimizeEventDetails = () => (
    { type: EVENTS.ACTIONS.CLOSE_EVENT_DETAILS }
)

/**
 * Unlock a Event and close editor if opened - used when item closed from workqueue
 * @param {object} item - The Event item to unlock
 * @return Promise
 */
const unlockAndCloseEditor = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.unlock({ _id: item._id }))
        .then(() => {
            if (selectors.getHighlightedEvent(getState()) === item._id) {
                dispatch(self.minimizeEventDetails())
            }

            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Could not unlock the event.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Action to unlock and open the Edit Event panel with the supplied Event
 * @param {object} event - The Event ID to edit
 * @return Promise
 */
const _unlockAndOpenEventDetails = (event) => (
    (dispatch) => (
        dispatch(eventsApi.unlock(event)).then((item) => {
            dispatch(eventsApi.receiveEvents([item]))
            // Call openPlanningEditor to obtain a new lock for editing
            // Recurring events item resolved might not be the item we want to open
            // So, use original parameter (event) to open
            dispatch(self._openEventDetails(event))
        }, () => (Promise.reject()))
    )
)

/**
 * Spike an event and notify the user of the result
 * @param {object} event - The event to spike
 */
const spike = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.spike(event))
        .then((events) => (
            dispatch(fetchSelectedAgendaPlannings())
            .then(
                () => {
                    dispatch(hideModal())
                    const currentPlanId = selectors.getCurrentPlanningId(getState())

                    events.forEach((e) => {
                        if (e._plannings) {
                            const planIds = e._plannings.map((p) => (p._id))
                            if (planIds.indexOf(currentPlanId) > -1) {
                                dispatch(planning.ui.closeEditor())
                            }
                        }
                    })

                    notify.success('The event(s) have been spiked')
                    return Promise.resolve(events)
                },

                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to load events and plannings')
                    )

                    return Promise.reject(error)
                }
            )

        ), (error) => {
            dispatch(hideModal())
            notify.error(
                getErrorMessage(error, 'Failed to spike the event(s)')
            )

            return Promise.reject(error)
        })
    )
)

const _openBulkSpikeModal = (events) => (
    (dispatch) => {
        if (!Array.isArray(events)) {
            events = [events]
        }

        dispatch(showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: `Do you want to spike these ${events.length} events?`,
                action: () => dispatch(self.spike(events)),
            },
        }))
    }
)

const _openUnspikeModal = (events) => (
    (dispatch) => {
        if (!Array.isArray(events)) {
            events = [events]
        }

        dispatch(showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: `Do you want to unspike these ${events.length} events?`,
                action: () => dispatch(self.unspike(events)),
            },
        }))
    }
)

const unspike = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.unspike(event))
        .then((events) => (
            Promise.all(
                [
                    dispatch(self.refetchEvents()),
                    dispatch(fetchSelectedAgendaPlannings()),
                ]
            )
            .then(
                () => {
                    dispatch(hideModal())

                    notify.success('The event(s) have been unspiked')
                    return Promise.resolve(events)
                },

                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to load events and plannings')
                    )

                    return Promise.reject(error)
                }
            )

        ), (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to spike the event(s)')
            )

            return Promise.reject(error)
        })
    )
)

/**
 * Action Dispatcher to re-fetch the current list of events.
 */
const refetchEvents = () => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.refetchEvents())
        .then((events) => {
            dispatch(self.setEventsList(events.map((e) => (e._id))))
            return Promise.resolve(events)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to refetch events')
            )

            return Promise.reject(error)
        })
    )
)

const cancelEvent = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.cancelEvent(event))
        .then(() => {
            dispatch(hideModal())
            notify.success('Event has been cancelled')

            return Promise.resolve()
        }, (error) => {
            dispatch(hideModal())

            notify.error(
                getErrorMessage(error, 'Failed to cancel the Event!')
            )

            return Promise.reject(error)
        })
    )
)

const postponeEvent = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.postponeEvent(event))
        .then(() => {
            dispatch(hideModal())
            notify.success('Event has been postponed')

            return Promise.resolve()
        }, (error) => {
            dispatch(hideModal())

            notify.error(
                getErrorMessage(error, 'Failed to postpone the Event!')
            )

            return Promise.reject(error)
        })
    )
)

const updateTime = (event, publish=false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.UPDATE_TIME.label,
        'update_time',
        false,
        publish
    ))
)

const openSpikeModal = (event, publish=false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        GENERIC_ITEM_ACTIONS.SPIKE.label,
        null,
        true,
        publish
    ))
)

const openCancelModal = (event, publish=false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label,
        'cancel_event',
        true,
        publish
    ))
)

const openPostponeModal = (event, publish=false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label,
        'postpone_event',
        true,
        publish
    ))
)

const openRescheduleModal = (event, publish=false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label,
        'reschedule_event',
        true,
        publish,
        true
    ))
)

const convertToRecurringEvent = (event, publish) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label,
        'convert_recurring',
        false,
        publish,
        true
    ))
)

const _openActionModal = (
    event,
    action,
    lockAction=null,
    loadPlannings=false,
    publish=false,
    large=false
) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.lock(event, lockAction))
        .then((lockedEvent) => (
            dispatch(eventsApi.loadEventDataForAction(lockedEvent, loadPlannings, publish))
            .then((eventDetail) => (
                dispatch(showModal({
                    modalType: 'ITEM_ACTIONS_MODAL',
                    modalProps: {
                        eventDetail,
                        actionType: action,
                        large,
                    },
                }))
            ), (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to load associated Events')
                )

                return Promise.reject(error)
            })
        ), (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to obtain the Event lock')
            )

            return Promise.reject(error)
        })
    )
)

const rescheduleEvent = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.rescheduleEvent(event))
        .then((updatedEvent) => {
            const duplicatedEvent = last(get(updatedEvent, 'duplicate_to', []))
            if (isItemRescheduled(updatedEvent) && duplicatedEvent) {
                dispatch(self._openEventDetails({ _id: duplicatedEvent }))
            } else {
                dispatch(self._openEventDetails(event))
            }

            dispatch(hideModal())
            notify.success('Event has been rescheduled')

            return Promise.resolve()
        }, (error) => {
            dispatch(hideModal())

            notify.error(
                getErrorMessage(error, 'Failed to reschedule the Event!')
            )

            return Promise.reject(error)
        })
    )
)

/**
 * Action to set the list of events in the current list
 * @param {Array} idsList - An array of Event IDs to assign to the current list
 * @return object
 */
const setEventsList = (idsList) => ({
    type: EVENTS.ACTIONS.SET_EVENTS_LIST,
    payload: idsList,
})

/**
 * Opens the Event in preview/read-only mode
 * @param {object} event - The Event ID to preview
 * @return Promise
 */
const _previewEvent = (event) => ({
    type: EVENTS.ACTIONS.PREVIEW_EVENT,
    payload: get(event, '_id'),
})

/**
 * Action to open Event Advanced Search panel
 * @return object
 */
const openAdvancedSearch = () => (
    { type: EVENTS.ACTIONS.OPEN_ADVANCED_SEARCH }
)

/**
 * Action to close the Event Advanced Search panel
 * @return object
 */
const closeAdvancedSearch = () => (
    { type: EVENTS.ACTIONS.CLOSE_ADVANCED_SEARCH }
)

const openBulkSpikeModal = checkPermission(
    _openBulkSpikeModal,
    PRIVILEGES.SPIKE_EVENT,
    'Unauthorised to spike an Event'
)

const openUnspikeModal = checkPermission(
    _openUnspikeModal,
    PRIVILEGES.UNSPIKE_EVENT,
    'Unauthorised to unspike an Event'
)

const openEventDetails = checkPermission(
    _openEventDetails,
    PRIVILEGES.EVENT_MANAGEMENT,
    'Unauthorised to edit an event!',
    previewEvent
)

const unlockAndOpenEventDetails = checkPermission(
    _unlockAndOpenEventDetails,
    PRIVILEGES.PLANNING_UNLOCK,
    'Unauthorised to edit an event!'
)

const self = {
    _openEventDetails,
    _unlockAndOpenEventDetails,
    _previewEvent,
    spike,
    unspike,
    refetchEvents,
    setEventsList,
    openSpikeModal,
    openBulkSpikeModal,
    openUnspikeModal,
    openEventDetails,
    unlockAndOpenEventDetails,
    closeEventDetails,
    previewEvent,
    openAdvancedSearch,
    closeAdvancedSearch,
    cancelEvent,
    openCancelModal,
    updateTime,
    minimizeEventDetails,
    unlockAndCloseEditor,
    openRescheduleModal,
    rescheduleEvent,
    postponeEvent,
    openPostponeModal,
    _openActionModal,
    convertToRecurringEvent,
}

export default self
