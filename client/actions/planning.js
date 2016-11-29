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
