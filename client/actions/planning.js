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
        let original = {}
        if (planning._id) {
            const plannings = selectors.getStoredPlannings(getState())
            original = cloneDeep(plannings[planning._id])
        }
        // remove all properties starting with _,
        // otherwise it will fail for "unknown field" with `_type`
        planning = pickBy(planning, (v, k) => (!k.startsWith('_')))
        // remove nested event, replace by its reference
        if (planning.event_item && planning.event_item._id) {
            planning.event_item = planning.event_item._id
        }
        // save through the api
        return api('planning').save(original, planning)
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

const addPlannings = (plannings) => (
    { type: 'ADD_PLANNINGS', payload: plannings }
)

const requestAgendas = () => (
    { type: 'REQUEST_AGENDAS' }
)

export const fetchAgendas = () => (
    (dispatch, getState, { api }) => {
        dispatch(requestAgendas())
        return api('planning').query({ where: { planning_type: 'agenda' } })
        .then((data) => {
            dispatch(receiveAgendas(data._items))
        })
    }
)

const fetchSelectedAgendaPlannings = () => (
    (dispatch, getState, { api }) => {
        const agenda = selectors.getCurrentAgenda(getState())
        if (!agenda || !agenda.planning_items) return
        const query = {
            source: { filter: { bool: {
                should: agenda.planning_items.map((pid) => ({ term: { _id: pid } }))
            } } },
            embedded: { event_item: 1 }, // nest event to planning
        }
        return api('planning').query(query)
        .then((data) => (dispatch(addPlannings(data._items))))
    }
)

export const selectAgenda = (agendaId) => (
    (dispatch) => {
        dispatch({ type: 'SELECT_AGENDA', payload: agendaId })
        dispatch(fetchSelectedAgendaPlannings())
    }
)

export const openPlanningEditor = (planning) => (
    { type: 'OPEN_PLANNING_EDITOR', payload: planning }
)

export const closePlanningEditor = () => (
    { type: 'CLOSE_PLANNING_EDITOR' }
)
