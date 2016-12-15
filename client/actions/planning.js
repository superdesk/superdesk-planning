import { hideModal } from './modal'
import * as selectors from '../selectors'
import { pickBy, cloneDeep } from 'lodash'

export const createAgenda = ({ name }) => (
    (dispatch, getState, { api }) => {
        api('planning').save({}, {
            planning_type: 'agenda',
            name: name
        })
        .then((agenda) => {
            dispatch(hideModal())
            dispatch(addOrReplaceAgenda(agenda))
            dispatch(selectAgenda(agenda._id))
        })
    }
)

/** Create a planning from an event */
const createPlanningFromEvent = (event) => (
    (dispatch) => (
        dispatch(savePlanning({
            event_item: event._id,
            slugline: event.name,
            headline: event.definition_short,
            subject: event.subject,
        }))
    )
)

export const savePlanningAndReloadCurrentAgenda = (planning) => (
    (dispatch) => (
        dispatch(savePlanning(planning))
        .then(() => (
            dispatch(fetchSelectedAgendaPlannings())
        ))
    )
)

export const savePlanning = (planning) => (
    (dispatch, getState, { api }) => {
        // find original
        let originalPlanning = {}
        if (planning._id) {
            const plannings = selectors.getStoredPlannings(getState())
            originalPlanning = cloneDeep(plannings[planning._id])
        }
        // remove all properties starting with _,
        // otherwise it will fail for "unknown field" with `_type`
        planning = pickBy(planning, (v, k) => (!k.startsWith('_')))
        // remove nested event, replace by its reference
        if (planning.event_item && planning.event_item._id) {
            planning.event_item = planning.event_item._id
        }
        // clone and remove the nested coverages to save them later
        const coverages = cloneDeep(planning.coverages)
        delete planning.coverages
        // remove nested original creator
        delete planning.original_creator
        // save through the api
        return api('planning').save(originalPlanning, planning)
        // save/delete coverages, and return the planning
        .then((planning) => {
            const promises = []
            // saves coverages
            promises.concat(coverages.map((coverage) => {
                coverage.planning_item = planning._id
                // patch or post ? look for an original coverage
                const originalCoverage = cloneDeep(originalPlanning.coverages
                    .find((c) => (c._id === coverage._id))) || {}
                return api('coverage').save(originalCoverage, coverage)
            }))
            // deletes coverages
            originalPlanning.coverages.forEach((originalCoverage) => {
                // if there is a coverage in the original planning that is not anymore
                // in the saved planning, we delete it
                if (coverages.findIndex((c) => (c._id && c._id === originalCoverage._id)) === -1) {
                    promises.push(
                        api('coverage').remove(originalCoverage)
                    )
                }
            })
            return Promise.all(promises).then(() => (planning))
        })
    }
)

const addOrReplaceAgenda = (agenda) => (
    { type: 'ADD_OR_REPLACE_AGENDA', payload: agenda }
)

const addPlanningToAgenda = ({ planning, agenda }) => (
    (dispatch, getState, { api }) => {
        // clone agenda
        agenda = cloneDeep(agenda)
        // init planning_items array if does not exist yet
        let planningItems = agenda.planning_items || []
        // add planning to planning_items
        planningItems.push(planning._id)
        // update the agenda
        return api('planning').save(agenda, {
            planning_items: planningItems
        }).then((agenda) => (
            // replace the agenda in the store
            dispatch(addOrReplaceAgenda(agenda))
        ))
    }
)

export const addEventToCurrentAgenda = (event) => (
    (dispatch, getState) => {
        const agenda = selectors.getCurrentAgenda(getState())
        if (agenda) {
            // create a planning item from the given event
            return dispatch(createPlanningFromEvent(event))
            .then((planning) => (
                // insert and save the planning into the agenda
                dispatch(addPlanningToAgenda({ planning, agenda }))
            ))
            .then(() => (
                // reload the plannings of the current calendar
                dispatch(fetchSelectedAgendaPlannings())
            ))
        }
    }
)

const receiveAgendas = (agendas) => (
    { type: 'RECEIVE_AGENDAS', payload: agendas }
)

const receivePlannings = (plannings) => (
    { type: 'RECEIVE_PLANNINGS', payload: plannings }
)

const requestAgendas = () => (
    { type: 'REQUEST_AGENDAS' }
)

const requestAgendaPlannings = () => (
    { type: 'REQUEST_AGENDA_PLANNNGS' }
)

export const fetchAgendas = () => (
    (dispatch, getState, { api }) => {
        // annonce that we are loading agendas
        dispatch(requestAgendas())
        // fetch the agenda through the api
        return api('planning').query({ where: { planning_type: 'agenda' } })
        // annonce that we received the agendas
        .then((data) => {
            dispatch(receiveAgendas(data._items))
        })
        // loads the agenda plannings if an agenda is selected
        .then(() => {
            if (selectors.getCurrentAgenda(getState())) {
                dispatch(fetchSelectedAgendaPlannings())
            }
        })
    }
)

const fetchSelectedAgendaPlannings = () => (
    (dispatch, getState, { api }) => {
        const agenda = selectors.getCurrentAgenda(getState())
        if (!agenda || !agenda.planning_items) return Promise.resolve()
        dispatch(requestAgendaPlannings())
        const query = {
            source: { filter: { bool: {
                should: agenda.planning_items.map((pid) => ({ term: { _id: pid } }))
            } } },
            embedded: { event_item: 1, original_creator: 1 }, // nest event and creator to planning
        }
        return api('planning').query(query)
        .then((response) => (dispatch(receivePlannings(response._items))))
    }
)

export const selectAgenda = (agendaId) => (
    (dispatch, getState, { $timeout, $location }) => {
        // save in store selected agenda
        dispatch({ type: 'SELECT_AGENDA', payload: agendaId })
        // update the url (deep linking)
        $timeout(() => ($location.search('agenda', agendaId)))
        // reload the plannings list
        return dispatch(fetchSelectedAgendaPlannings())
    }
)

export const openPlanningEditor = (planning) => (
    (dispatch) => (dispatch({ type: 'OPEN_PLANNING_EDITOR', payload: planning }))
)

export const closePlanningEditor = () => (
    { type: 'CLOSE_PLANNING_EDITOR' }
)
