import { hideModal } from './modal'
import * as selectors from '../selectors'
import { SubmissionError } from 'redux-form'
import { cloneDeep, get } from 'lodash'
import { closePlanningEditor, fetchPlannings, savePlanning } from './planning'
import { PRIVILEGES, ITEM_STATE, AGENDA } from '../constants'
import { checkPermission, getErrorMessage } from '../utils'

/**
 * Creates or updates an Agenda
 * @param {string} _id - The ID of the Agenda
 * @param {string} name - The name of the Agenda to create
 * @return Promise
 */
const _createOrUpdateAgenda = ({ _id, name }) => (
    (dispatch, getState, { api, notify }) => {
        let originalAgenda = {}
        const agendas = selectors.getAgendas(getState())

        if (_id) {
            originalAgenda = agendas.find((agenda) => agenda._id === _id)
            originalAgenda = cloneDeep(originalAgenda || {})
        }

        return api('agenda').save(originalAgenda, { name })
        .then((agenda) => {
            notify.success('The agenda has been created/updated.')
            dispatch(hideModal())
            dispatch(addOrReplaceAgenda(agenda))
            dispatch(selectAgenda(agenda._id))
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
        // close the planning details
        dispatch(closePlanningEditor())
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
            embedded: { original_creator: 1 }, // nest creator to planning
            max_results: 10000,
            timestamp: new Date(),
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
 * Action dispatcher that adds the supplied planning item to the agenda
 * @param {object} planning - The planning item to add to the agenda
 * @param {object} agenda - The agenda to add the planning to
 * @return Promise
 */
const _addPlanningToAgenda = ({ planning, agenda }) => (
    (dispatch, getState, { api }) => {
        // clone agenda
        agenda = cloneDeep(agenda)
        // init planning_items array if does not exist yet
        let planningItems = agenda.planning_items || []
        // add planning to planning_items
        planningItems.push(planning._id)
        // update the agenda
        return api('agenda').save(agenda, { planning_items: planningItems })
        .then((agenda) => {
            // replace the agenda in the store
            dispatch(addOrReplaceAgenda(agenda))
            return agenda
        })
    }
)

/**
 * Action dispatcher that adds the supplied planning item to the
 * currently selected agenda
 * @param {object} planning - The planning item to add to the agenda
 * @return Promise
 */
const _addToCurrentAgenda = (planning) => (
    (dispatch, getState, { notify }) => {
        const currentAgenda = selectors.getCurrentAgenda(getState())
        if (!currentAgenda) throw Error('unable to find the current agenda')
        // add the planning to the agenda
        return dispatch(addPlanningToAgenda({
            planning: planning,
            agenda: currentAgenda,
        }))
        .then(() => {
            notify.success('The planning has been added to the agenda')
            return planning
        })
    }
)

/**
 * Action dispatcher that creates a planning item from the supplied event,
 * then adds this to the currently selected agenda
 * @param {object} event - The event used to create the planning item
 * @return Promise
 */
const _addEventToCurrentAgenda = (event) => (
    (dispatch, getState, { notify }) => {
        // Check if no agenda is selected, or the current agenda is spiked
        // And notify the end user of the error
        const currentAgenda = selectors.getCurrentAgenda(getState())
        if (!currentAgenda) {
            notify.error('No Agenda selected.')
            return Promise.resolve()
        } else if (currentAgenda.state === ITEM_STATE.SPIKED) {
            notify.error('Current Agenda is spiked.')
            return Promise.resolve()
        } else if (get(event, 'state', 'active') === ITEM_STATE.SPIKED) {
            notify.error('Cannot create a Planning item from a spiked event!')
            return Promise.resolve()
        }

        // planning inherits some fields from the given event
        return dispatch(savePlanning({
            event_item: event._id,
            slugline: event.name,
            headline: event.definition_short,
            subject: event.subject,
            anpa_category: event.anpa_category,
        }))
        .then((planning) => (
            dispatch(addToCurrentAgenda(planning))
            // reload the plannings of the current calendar
            .then(() => dispatch(fetchSelectedAgendaPlannings()))
        ))
    }
)

/**
 * Action dispatcher that marks an Agenda as spiked
 * @param {object} agenda - The agenda to spike
 * @return arrow function
 */
const _spikeAgenda = (agenda) => (
    (dispatch, getState, { api, notify }) => (
        api.update('agenda_spike', agenda, {})
        .then(() => {
            notify.success('The Agenda has been spiked.')
            dispatch({
                type: AGENDA.ACTIONS.SPIKE_AGENDA,
                payload: agenda,
            })
            dispatch(fetchAgendas())
        }, (error) => {
            notify.error(getErrorMessage(
                error,
                'There was a problem, Agenda not spiked.'
            ))
        })
    )
)

/**
 * Action dispatcher that marks an Agenda as active
 * @param {object} agenda - The agenda to unspike
 * @return thunk function
 */
const _unspikeAgenda = (agenda) => (
    (dispatch, getState, { api, notify }) => (
        api.update('agenda_unspike', agenda, {})
        .then(() => {
            notify.success('The Agenda has been unspiked.')
            dispatch({
                type: AGENDA.ACTIONS.UNSPIKE_AGENDA,
                payload: agenda,
            })
            dispatch(fetchAgendas())
        }, (error) => {
            notify.error(getErrorMessage(
                error,
                'There was a problem, Agenda was not unspiked.'
            ))
        })
    )
)

/**
 * Action dispatcher that fetches all planning items for the
 * currently selected agenda
 * @return arrow function
 */
const fetchSelectedAgendaPlannings = () => (
    (dispatch, getState) => {
        const agenda = selectors.getCurrentAgenda(getState())
        if (!agenda || !agenda.planning_items) return Promise.resolve()
        return dispatch(fetchPlannings({ planningIds: agenda.planning_items }))
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
    'Unauthorised to create or update an agenda'
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

/**
 * Action Dispatcher to add a Planning Item to an Agenda
 * Also checks the permission if the user can do so
 * @return thunk function
 */
const addPlanningToAgenda = checkPermission(
    _addPlanningToAgenda,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to add a Planning Item to an Agenda'
)

/**
 * Action Dispatcher to add a Planning Item to the current Agenda
 * Also checks the permission if the user can do so
 * @return thunk function
 */
const addToCurrentAgenda = checkPermission(
    _addToCurrentAgenda,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to add a Planning Item to an Agenda'
)

/** Set permission for spiking agenda */
const spikeAgenda = checkPermission(
    _spikeAgenda,
    PRIVILEGES.SPIKE_AGENDA,
    'Unauthorised to spike an Agenda.'
)

/** Set permission for unspiking agenda */
const unspikeAgenda = checkPermission(
    _unspikeAgenda,
    PRIVILEGES.UNSPIKE_AGENDA,
    'Unauthorised to unspike an Agenda.'
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
    'agenda:created': onAgendaCreatedOrUpdated,
    'agenda:updated': onAgendaCreatedOrUpdated,
    'agenda:spiked': onAgendaCreatedOrUpdated,
    'agenda:unspiked': onAgendaCreatedOrUpdated,
}

export {
    createOrUpdateAgenda,
    spikeAgenda,
    unspikeAgenda,
    fetchAgendas,
    fetchAgendaById,
    selectAgenda,
    addToCurrentAgenda,
    addPlanningToAgenda,
    addEventToCurrentAgenda,
    fetchSelectedAgendaPlannings,
    agendaNotifications,
}
