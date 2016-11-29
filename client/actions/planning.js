import { hideModal } from './modal'

export const createAgenda = ({ name }) => (
    (dispatch, getState, { api }) => {
        api('planning').save({}, {
            planning_type: 'agenda',
            name: name
        })
        .then(() => (
            dispatch(hideModal())
        ))
    }
)

export const addEventToCurrentAgenda = (event) => (
    (dispatch) => {
        dispatch({ type: 'ADD_EVENT_TO_CURRENT_AGENDA', payload: event })
    }
)

export const setAgendas = (agendas) => (
    { type: 'SET_AGENDAS', payload: agendas }
)

export const loadAgendas = () => (
    (dispatch, getState, { api }) => (
        api('planning').query({
            source: { query: { term: { planning_type: 'agenda' } } }
        })
        .then((data) => (dispatch(setAgendas(data._items))))
    )
)

export const selectAgenda = (agenda) => (
    { type: 'SELECT_AGENDA', payload: agenda }
)
