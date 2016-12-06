import { hideModal } from './modal'
import * as selectors from '../selectors'

export const createAgenda = ({ name }) => (
    (dispatch, getState, { api }) => {
        api('planning').save({}, {
            planning_type: 'agenda',
            name: name
        })
        .then((agenda) => {
            dispatch(hideModal())
            dispatch(addOrReplaceAgenda(agenda))
        })
    }
)

const createPlanning = ({ event }) => (
    (dispatch, getState, { api }) => (
        api('planning').save({}, {
            event_item: event._id,
            slugline: event.name,
            headline: event.definition_short,
            subject: event.subject,
        })
    )
)

const addOrReplaceAgenda = (agenda) => (
    { type: 'ADD_OR_REPLACE_AGENDA', payload: agenda }
)

const addPlanningToAgenda = ({ planning, agenda }) => (
    (dispatch, getState, { api }) => {
        // clone agenda
        agenda = agenda ? JSON.parse(JSON.stringify(agenda)) : {}
        let planningItems = agenda.planning_items || []
        planningItems.push(planning._id)
        return api('planning').save(agenda, {
            planning_items: planningItems
        }).then((agenda) => {
            // replace the agenda in the store
            dispatch(addOrReplaceAgenda(agenda))
            // reload the plannings of the current calendar
            return dispatch(fetchSelectedAgendaPlannings(agenda))
        })
    }
)

export const addEventToCurrentAgenda = (event) => (
    (dispatch, getState) => {
        const agenda = selectors.getSelectedAgenda(getState())
        if (agenda) {
            return dispatch(createPlanning({ event: event }))
            .then((planning) => (
                dispatch(addPlanningToAgenda({ planning, agenda }))
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
        const agenda = selectors.getSelectedAgenda(getState())
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
