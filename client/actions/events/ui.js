import { showModal, hideModal } from '../index'
import { checkPermission, getErrorMessage } from '../../utils'
import { PRIVILEGES, EVENTS } from '../../constants'
import planning from '../planning'
import eventsApi from './api'
import { fetchSelectedAgendaPlannings } from '../agenda'
import * as selectors from '../../selectors'

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
 * Open the Spike Single Modal
 * @param {object} event - The Event to be spiked
 */
const _openSingleSpikeModal = (event) => (
    (dispatch, getState, { notify }) => (
        dispatch(planning.api.loadPlanningByEventId(event._id))
        .then((planningItems) => (
            dispatch(showModal({
                modalType: 'SPIKE_EVENT',
                modalProps: {
                    eventDetail: {
                        ...event,
                        _plannings: planningItems,
                    },
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
                modalType: 'SPIKE_EVENT',
                modalProps: { eventDetail: events },
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
            Promise.all(
                [
                    dispatch(self.refetchEvents()),
                    dispatch(fetchSelectedAgendaPlannings()),
                ]
            )
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

/**
 * Action to set the list of events in the current list
 * @param {Array} idsList - An array of Event IDs to assign to the current list
 * @return object
 */
const setEventsList = (idsList) => ({
    type: EVENTS.ACTIONS.SET_EVENTS_LIST,
    payload: idsList,
})

const openSpikeModal = checkPermission(
    _openSpikeModal,
    PRIVILEGES.SPIKE_EVENT,
    'Unauthorised to spike an Event'
)

const self = {
    _openSpikeModal,
    _openSingleSpikeModal,
    _openMultiSpikeModal,
    spike,
    refetchEvents,
    setEventsList,
    openSpikeModal,
}

export default self
