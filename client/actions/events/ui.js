import { showModal, hideModal } from '../index'
import { PRIVILEGES, EVENTS, GENERIC_ITEM_ACTIONS } from '../../constants'
import planning from '../planning'
import eventsApi from './api'
import { fetchSelectedAgendaPlannings } from '../agenda'
import * as selectors from '../../selectors'
import { get, last } from 'lodash'
import moment from 'moment'
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
 * Helper function to open the appropriate Spike Modal
 * @param {object} event - The Event to be spiked
 */
const _openSpikeModal = (event) => (
    (dispatch) => {
        if (!event.recurrence_id) {
            return dispatch(self._openSingleSpikeModal(event))
        } else {
            return dispatch(self._openMultiSpikeModal(event))
        }
    }
)

/**
 * Open Update Time action modal
 * @param {object} event - The Event to update
 */
const updateTime = (event, publish=false) => (
    (dispatch, getState, { notify }) => {
        if (!isItemLockedInThisSession(event, selectors.getSessionDetails(getState()))) {
            return dispatch(eventsApi.lock(event, 'update_time'))
                .then((lockedEvent) => {
                    dispatch(_openUpdateTimeModal(lockedEvent, publish))
                }, (error) => {
                    notify.error(getErrorMessage(error, 'Failed to obtain the Event lock'))
                    return Promise.reject(error)
                })
        } else {
            dispatch(_openUpdateTimeModal(event, publish))
        }
    }
)

const convertToRecurringEvent = (event, publish=false) => (
    (dispatch, getState, { notify }) => {
        if (!isItemLockedInThisSession(event, selectors.getSessionDetails(getState()))) {
            return dispatch(eventsApi.lock(event, 'convert_recurring'))
                .then((lockedEvent) => {
                    dispatch(_openConvertToRecurringEventModal(lockedEvent, publish))
                }, (error) => {
                    notify.error(getErrorMessage(error, 'Failed to obtain the Event lock'))
                    return Promise.reject(error)
                })
        } else {
            dispatch(_openConvertToRecurringEventModal(event, publish))
        }
    }
)

const _openConvertToRecurringEventModal = (event, publish) => (
    (dispatch) => (
        dispatch(showModal({
            modalType: 'ITEM_ACTIONS_MODAL',
            modalProps: {
                eventDetail: {
                    ...event,
                    _publish: publish,
                },
                actionType: EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label,
            },
        }))
    )
)

const _openUpdateTimeModal = (event, publish) => (
    (dispatch) => {
        if (get(event, 'recurrence_id')) {
            return dispatch(eventsApi.query({ recurrenceId: event.recurrence_id }))
            .then((relatedEvents) => {
                dispatch(showModal({
                    modalType: 'ITEM_ACTIONS_MODAL',
                    modalProps: {
                        eventDetail: {
                            ...event,
                            _recurring: get(relatedEvents, '_items', [event]),
                            _publish: publish,
                            _events: [],
                            _originalEvent: event,
                        },
                        actionType: EVENTS.ITEM_ACTIONS.UPDATE_TIME.label,
                    },
                }))
            })
        }

        return dispatch(showModal({
            modalType: 'ITEM_ACTIONS_MODAL',
            modalProps: {
                eventDetail: { ...event },
                actionType: EVENTS.ITEM_ACTIONS.UPDATE_TIME.label,
            },
        }))
    }
)

/**
 * Open the Spike Single Modal
 * @param {object} event - The Event to be spiked
 */
const _openSingleSpikeModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.loadPlanningByEventId(event._id))
        .then((planningItems) => (
            dispatch(showModal({
                modalType: 'ITEM_ACTIONS_MODAL',
                modalProps: {
                    eventDetail: {
                        ...event,
                        _plannings: planningItems,
                    },
                    actionType: GENERIC_ITEM_ACTIONS.SPIKE.label,
                },
            }))
        ), (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to load associated Planning items.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Open the Spike Multiple Modal
 * @param {object} event - The Event to be spiked
 */
const _openMultiSpikeModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.loadRecurringEventsAndPlanningItems(event))
        .then((events) => {
            dispatch(showModal({
                modalType: 'ITEM_ACTIONS_MODAL',
                modalProps: {
                    eventDetail: events,
                    actionType: GENERIC_ITEM_ACTIONS.SPIKE.label,
                },
            }))
            return Promise.resolve(events)
        }, (error) => {
            notify.error(
                getErrorMessage(
                    error,
                    'Failed to load associated planning items'
                )
            )
            return Promise.reject(error)
        })
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

const _openCancelModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.lock(event, 'cancel'))
        .then((lockedEvent) => {
            if (!event.recurrence_id) {
                return dispatch(self._openSingleCancelModal(lockedEvent))
            } else {
                return dispatch(self._openMultiCancelModal(lockedEvent))
            }
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to obtain the Event lock')
            )

            return Promise.reject(error)
        })
    )
)

const _openSingleCancelModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.loadPlanningByEventId(event._id))
        .then((planningItems) => (
            dispatch(showModal({
                modalType: 'ITEM_ACTIONS_MODAL',
                modalProps: {
                    eventDetail: {
                        ...event,
                        _plannings: planningItems,
                    },
                    actionType: EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label,
                },
            }))
        ), (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to load associated Planning items.')
            )

            return Promise.reject(error)
        })
    )
)

const _openMultiCancelModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.loadRecurringEventsAndPlanningItems(event))
        .then((events) => {
            dispatch(showModal({
                modalType: 'ITEM_ACTIONS_MODAL',
                modalProps: {
                    eventDetail: events,
                    actionType: EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label,
                },
            }))
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to load associated Planning items')
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

const _openRescheduleModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.lock(event, 'reschedule'))
        .then((lockedEvent) => {
            // The form fields expects the date/time to be a moment instance
            // So convert them before opening the modal
            lockedEvent.dates.start = moment(lockedEvent.dates.start)
            lockedEvent.dates.end = moment(lockedEvent.dates.end)
            if (!event.recurrence_id) {
                return dispatch(self._openSingleRescheduleModal(lockedEvent))
            } else {
                return dispatch(self._openMultiRescheduleModal(lockedEvent))
            }
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to obtain the Event lock')
            )

            return Promise.reject(error)
        })
    )
)

const _openSingleRescheduleModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.loadPlanningByEventId(event._id))
        .then((planningItems) => (
            dispatch(showModal({
                modalType: 'ITEM_ACTIONS_MODAL',
                modalProps: {
                    eventDetail: {
                        ...event,
                        _plannings: planningItems,
                    },
                    actionType: EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label,
                },
            }))
        ), (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to load associated Planning items.')
            )

            return Promise.reject(error)
        })
    )
)

const _openMultiRescheduleModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(eventsApi.loadRecurringEventsAndPlanningItems(event))
        .then((events) => {
            dispatch(showModal({
                modalType: 'ITEM_ACTIONS_MODAL',
                modalProps: {
                    eventDetail: events,
                    actionType: EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label,
                },
            }))
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to load associated Planning items.')
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

const openSpikeModal = checkPermission(
    _openSpikeModal,
    PRIVILEGES.SPIKE_EVENT,
    'Unauthorised to spike an Event'
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

const openCancelModal = checkPermission(
    _openCancelModal,
    PRIVILEGES.EVENT_MANAGEMENT,
    'Unauthorised to spike an Event'
)

const openRescheduleModal = checkPermission(
    _openRescheduleModal,
    PRIVILEGES.EVENT_MANAGEMENT,
    'Unauthorised to reschedule an Event'
)

const self = {
    _openEventDetails,
    _openSpikeModal,
    _openSingleSpikeModal,
    _openMultiSpikeModal,
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
    _openCancelModal,
    _openSingleCancelModal,
    _openMultiCancelModal,
    openCancelModal,
    updateTime,
    minimizeEventDetails,
    unlockAndCloseEditor,
    _openRescheduleModal,
    _openSingleRescheduleModal,
    _openMultiRescheduleModal,
    openRescheduleModal,
    rescheduleEvent,
    convertToRecurringEvent,
}

export default self
