import { hideModal } from './modal'
import * as selectors from '../selectors'
import { SubmissionError } from 'redux-form'
import { cloneDeep, get } from 'lodash'
import { closePlanningEditor, fetchPlannings, savePlanning } from './planning'

/**
 * Action Dispatcher for creating a new Agenda
 * @param {string} name - The name of the Agenda to create
 * @return arrow function
 */
const createAgenda = ({ name }) => (
    (dispatch, getState, { api, notify }) => (
        api('agenda').save({}, { name: name })
            .then((agenda) => {
                notify.success('An agenda has been added.')
                dispatch(hideModal())
                dispatch(addOrReplaceAgenda(agenda))
                dispatch(selectAgenda(agenda._id))
            }, (error) => {
                let errorMessage = 'There was a problem, Agenda not created/updated.'
                if (get(error, 'data._message')) {
                    errorMessage = get(error, 'data._message')
                } else if (get(error, 'data._issues.validator exception')) {
                    errorMessage = get(error, 'data._issues.validator exception')
                }

                notify.error(errorMessage)
                throw new SubmissionError({
                    name: errorMessage,
                    _error: error.statusText,
                })
            })
    )
)

/**
 * Action for adding or updating an Agenda in the redux store
 * @param {object} agenda - The agenda object to send to the reducer
 * @return object
 */
const addOrReplaceAgenda = (agenda) => (
    {
        type: 'ADD_OR_REPLACE_AGENDA',
        payload: agenda,
    }
)

/**
 * Action for storing the list of Agenda's in the redux store
 * @param agendas
 * @return object
 */
const receiveAgendas = (agendas) => (
    {
        type: 'RECEIVE_AGENDAS',
        payload: agendas,
    }
)

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
            type: 'SELECT_AGENDA',
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
        dispatch({ type: 'REQUEST_AGENDAS' })
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
            let errorMessage = 'There was a problem, agendas could not be fetched'
            if (get(error, 'data._message')) {
                errorMessage = get(error, 'data._message')
            } else if (get(error, 'data._issues.validator exception')) {
                errorMessage = get(error, 'data.validator exception')
            }

            notify.error(errorMessage)
        })
    }
)

/**
 * Action dispatcher that adds the supplied planning item to the agenda
 * @param {object} planning - The planning item to add to the agenda
 * @param {object} agenda - The agenda to add the planning to
 * @return arrow function
 */
const addPlanningToAgenda = ({ planning, agenda }) => (
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
 * @return arrow function
 */
const addToCurrentAgenda = (planning) => (
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
 * @return arrow function
 */
const addEventToCurrentAgenda = (event) => (
    (dispatch, getState) => {
        // check if there is a current agenda, throw an error if not
        const currentAgenda = selectors.getCurrentAgenda(getState())
        if (!currentAgenda) throw 'unable to find the current agenda'
        // planning inherits some fields from the given event
        return dispatch(savePlanning({
            event_item: event._id,
            slugline: event.name,
            headline: event.definition_short,
            subject: event.subject,
            anpa_category: event.anpa_category,
        }))
        .then((planning) =>
            dispatch(addToCurrentAgenda(planning))
            // reload the plannings of the current calendar
            .then(() => dispatch(fetchSelectedAgendaPlannings()))
        )
    }
)

/**
 * Action dispatcher that deletes an Agenda
 * @param {object} agenda - The agenda to delete
 * @return arrow function
 */
const deleteAgenda = (agenda) => (
    (dispatch, getState, { api, notify }) => (
        api('agenda').remove(agenda)
        .then(() => {
            notify.success('The agenda has been deleted.')

            // close the editor if the removed agenda was opened
            if (agenda.planning_items && agenda.planning_items.length > 0) {
                if (agenda.planning_items.indexOf(
                    selectors.getCurrentPlanningId(getState())) > -1) {
                    dispatch(closePlanningEditor())
                }
            }

            // Reload agendas because they contain the list of the plannings to show and plannings
            dispatch(fetchAgendas())
        }, (error) => {
            let errorMessage = 'There was a problem, Agenda not deleted.'
            if (get(error, 'data._message')) {
                errorMessage = get(error, 'data._message')
            } else if (get(error, 'data._issues.validator exception')) {
                errorMessage = get(error, 'data._issues.validator exception')
            }

            notify.error(errorMessage)
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

export {
    createAgenda,
    deleteAgenda,
    fetchAgendas,
    selectAgenda,
    addToCurrentAgenda,
    addEventToCurrentAgenda,
    fetchSelectedAgendaPlannings,
}
