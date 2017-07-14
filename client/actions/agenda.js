import { hideModal } from './modal'
import * as selectors from '../selectors'
import { SubmissionError } from 'redux-form'
import { cloneDeep, pick } from 'lodash'
import { PRIVILEGES, ITEM_STATE, AGENDA } from '../constants'
import { checkPermission, getErrorMessage } from '../utils'
import { planning, showModal } from './index'

/**
 * Creates or updates an Agenda
 * @param {string} _id - The ID of the Agenda
 * @param {string} name - The name of the Agenda to create
 * @return Promise
 */
const _createOrUpdateAgenda = (newAgenda) => (
    (dispatch, getState, { api, notify }) => {
        let originalAgenda = {}
        const agendas = selectors.getAgendas(getState())
        let diff = pick(newAgenda, ['name', 'is_enabled'])

        if (newAgenda._id) {
            originalAgenda = agendas.find((agenda) => agenda._id === newAgenda._id)
            originalAgenda = cloneDeep(originalAgenda || {})
        }

        return api('agenda').save(originalAgenda, diff)
        .then((agenda) => {
            notify.success('The agenda has been created/updated.')
            dispatch(hideModal())
            dispatch(addOrReplaceAgenda(agenda))
        }, (error) => {
            let errorMessage = getErrorMessage(
                error,
                'There was a problem, Agenda is not created/updated.'
            )

            notify.error(errorMessage)
            throw new SubmissionError({
                name: errorMessage,
                _error: error.statusText,
            })
        })
    }
)

/**
 * Action for adding or updating an Agenda in the redux store
 * @param {object} agenda - The agenda object to send to the reducer
 * @return object
 */
const addOrReplaceAgenda = (agenda) => ({
    type: AGENDA.ACTIONS.ADD_OR_REPLACE_AGENDA,
    payload: agenda,
})

/**
 * Action for storing the list of Agenda's in the redux store
 * @param agendas
 * @return object
 */
const receiveAgendas = (agendas) => ({
    type: AGENDA.ACTIONS.RECEIVE_AGENDAS,
    payload: agendas,
})

/**
 * Action dispatcher that changes the selected Agenda to the one provided.
 * This also closes the PlanningEditor and fetches the plannings that are
 * associated with the agenda
 * @param {string} agendaId - The ID of the Agenda
 * @return arrow function
 */
const selectAgenda = (agendaId) => (
    (dispatch, getState, { $timeout, $location }) => {
        // save in store selected agenda
        dispatch({
            type: AGENDA.ACTIONS.SELECT_AGENDA,
            payload: agendaId,
        })

        // update the url (deep linking)
        $timeout(() => ($location.search('agenda', agendaId)))
        // reload the plannings list
        return dispatch(fetchSelectedAgendaPlannings())
    }
)

/**
 * Action dispatcher that fetches all Agendas using performFetchRequest
 * @return arrow function
 */
const fetchAgendas = (query={}) => (
    (dispatch, getState, { api, notify }) => {
        dispatch({ type: AGENDA.ACTIONS.REQUEST_AGENDAS })
        return api('agenda').query({
            source: query.source,
            where: query.where,
            max_results: 200,
        })
        .then((data) => {
            dispatch(receiveAgendas(data._items))
        }, (error) => {
            notify.error(getErrorMessage(
                error,
                'There was a problem, agendas could not be fetched'
            ))
        })
    }
)

/**
 * Action Dispatcher that fetches an Agenda by ID
 * and adds it to the redux store
 * @param {string} _id - The ID of the Agenda to fetch
 */
const fetchAgendaById = (_id) => (
    (dispatch, getState, { api, notify }) => (
        api('agenda').getById(_id)
        .then((agenda) => {
            dispatch(addOrReplaceAgenda(agenda))
            return Promise.resolve(agenda)
        }, (error) => {
            notify.error(getErrorMessage(error, 'Failed to fetch an Agenda!'))
        })
    )
)

/**
 * Action factory that ask for creating a planning item from the supplied event,
 * then calls addEventToCurrentAgenda
 * @param {array} events - The events needed to create the planning items
 */
const askForAddEventToCurrentAgenda = (events) => (
    (dispatch, getState) => {
        const currentAgenda = selectors.getCurrentAgenda(getState())
        if (currentAgenda) {
            const message = events.length === 1 ?
                'Do you want to add this event to the current agenda'
                : `Do you want to add these ${events.length} events to the current agenda ?`
            dispatch(showModal({
                modalType: 'CONFIRMATION',
                modalProps: {
                    body: message,
                    action: () => dispatch(addEventToCurrentAgenda(events)),
                },
            }))
        } else {
            dispatch(showModal({
                modalType: 'CONFIRMATION',
                modalProps: {
                    body: 'You have to select an agenda first',
                    action: () => {},
                },
            }))
        }
    }
)

/**
 * Action dispatcher that creates a planning item from the supplied event,
 * then adds this to the currently selected agenda
 * @param {array} events - The event used to create the planning item
 * @return Promise
 */
const _addEventToCurrentAgenda = (events) => (
    (dispatch, getState, { notify }) => {
        const currentAgenda = selectors.getCurrentAgenda(getState())
        if (!currentAgenda) {
            let errorMsg = 'You have to select an agenda first'
            notify.error(errorMsg)
            return Promise.reject(errorMsg)
        }

        if (!Array.isArray(events)) {
            events = [events]
        }

        const chunkSize = 5
        let promise = Promise.resolve()
        let plannings = []

        for (let i = 0; i < Math.ceil(events.length / chunkSize); i++) {
            let eventsChunk = events.slice(i * chunkSize, (i + 1) * chunkSize)
            promise = promise.then(() => (
                Promise.all(
                    eventsChunk.map((event) => (
                        dispatch(createPlanningFromEvent(event))
                    ))
                )
                .then((data) => data.forEach((p) => plannings.push(p)))
                .then(() => {
                    notify.pop()
                    notify.success(`created ${plannings.length}/${events.length} plannings`)
                })
            ))
        }
        // reload the plannings of the current calendar
        return promise
        .then(() => {
            notify.pop()
            notify.success(`created ${events.length} plannings !`)
        })
        .then(() => dispatch(fetchSelectedAgendaPlannings()))
    }
)

/**
 * Action dispatcher that creates a planning item from the supplied event,
 * @param {object} event - The event used to create the planning item
 * @return Promise
 */
const _createPlanningFromEvent = (event) => (
    (dispatch, getState, { notify }) => {
        // Check if no agenda is selected, or the current agenda is spiked
        // And notify the end user of the error
        const currentAgenda = selectors.getCurrentAgenda(getState())
        let error
        if (!currentAgenda) {
            error = 'No Agenda selected.'
        } else if (!currentAgenda.is_enabled) {
            error = 'Cannot create a Planning item from a disabled agenda!'
        } else if (event.state === ITEM_STATE.SPIKED) {
            error = 'Cannot create a Planning item from a spiked event!'
        }

        if (error) {
            notify.error(error)
            return Promise.reject(error)
        }

        // planning inherits some fields from the given event
        return dispatch(planning.api.save({
            event_item: event._id,
            slugline: event.slugline,
            headline: event.name,
            subject: event.subject,
            anpa_category: event.anpa_category,
            description_text: event.definition_short,
            agendas: [currentAgenda._id],
        }))
    }
)

/**
 * Action dispatcher that fetches all planning items for the
 * currently selected agenda
 * @return arrow function
 */
const fetchSelectedAgendaPlannings = () => (
    (dispatch, getState) => {
        const agenda = selectors.getCurrentAgenda(getState())

        return new Promise((resolve) => {
            if (!agenda) {
                resolve([])
            } else {
                const params = { agendas: agenda ? [agenda._id] : null }

                resolve(dispatch(planning.api.fetch(params)))
            }
        })
        .then((items) => (dispatch(planning.api.setInList(
            items.map((p) => p._id)
        ))))
    }
)

// Action Privileges
/**
 * Action Dispatcher for creating or updating an Agenda
 * Also checks the permission if the user can do so
 * @return thunk function
 */
const createOrUpdateAgenda = checkPermission(
    _createOrUpdateAgenda,
    PRIVILEGES.AGENDA_MANAGEMENT,
    'Unauthorised to create or update an agenda!'
)

/**
 * Action Dispatcher for creating a Planning Item from an Event
 * and adding that to the current Agenda.
 * Also checks the permission if the user can do so
 * @return thunk function
 */
const addEventToCurrentAgenda = checkPermission(
    _addEventToCurrentAgenda,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to create a new planning item!'
)

const createPlanningFromEvent = checkPermission(
    _createPlanningFromEvent,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to create a new planning item!'
)

// WebSocket Notifications
/**
 * Action Event when a new Agenda is created or updated
 * @param _e
 * @param {object} data - Agenda and User IDs
 */
const onAgendaCreatedOrUpdated = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            return dispatch(fetchAgendaById(data.item))
        }

    }
)

// Map of notification name and Action Event to execute
const agendaNotifications = {
    'agenda:created': () => (onAgendaCreatedOrUpdated),
    'agenda:updated': () => (onAgendaCreatedOrUpdated),
}

export {
    createOrUpdateAgenda,
    fetchAgendas,
    fetchAgendaById,
    selectAgenda,
    addEventToCurrentAgenda,
    askForAddEventToCurrentAgenda,
    fetchSelectedAgendaPlannings,
    agendaNotifications,
}
