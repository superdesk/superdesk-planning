import { cloneDeep } from 'lodash'

const replaceOrAddInAgendas = (agendas, agenda) => {
    if (agenda.planning_type !== 'agenda') {
        throw Error(`Try to add ${JSON.stringify(agenda)} but \'planning_type\' is not an agenda`)
    }

    const index = agendas.findIndex((a) => a._id === agenda._id)
    if (index === -1) {
        agendas.push(agenda)
    } else {
        agendas.splice(index, 1, agenda)
    }

    return agendas
}

const deletePlanningId = (pid, state) => {
    // clone plannings
    const plannings = cloneDeep(state.plannings)
    delete plannings[pid]
    return {
        ...state,
        plannings,
    }
}

const initialState  = {
    agendas: [],
    plannings: {},
    currentAgendaId: undefined,
    currentPlanningId: undefined,
    editorOpened: false,
    agendasAreLoading: false,
    planningsAreLoading: false,
}
/*eslint-disable complexity*/
const planningReducer = (state=initialState, action) => {
    switch (action.type) {
        case 'REQUEST_AGENDAS':
            return {
                ...state,
                agendasAreLoading: true,
            }
        case 'REQUEST_PLANINGS':
            return {
                ...state,
                planningsAreLoading: true,
            }
        case 'RECEIVE_PLANNINGS':
            // payload must be an array. If not, we transform
            action.payload = Array.isArray(action.payload) ? action.payload : [action.payload]
            // clone plannings
            var plannings = cloneDeep(state.plannings)
            // add to state.plannings, use _id as key
            action.payload.forEach((planning) => plannings[planning._id] = planning)
            // return new state
            return {
                ...state,
                plannings,
                planningsAreLoading: false,
            }
        case 'RECEIVE_AGENDAS':
            return {
                ...state,
                agendasAreLoading: false,
                agendas: action.payload,
            }
        case 'SELECT_AGENDA':
            return {
                ...state,
                currentAgendaId: action.payload,
            }
        case 'ADD_OR_REPLACE_AGENDA':
            return {
                ...state,
                agendas: replaceOrAddInAgendas(state.agendas.slice(), action.payload),
            }
        case 'DELETE_PLANNING':
            return deletePlanningId(action.payload, state)
        case 'OPEN_PLANNING_EDITOR':
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: action.payload,
            }
        case 'CLOSE_PLANNING_EDITOR':
            return {
                ...state,
                editorOpened: false,
                currentPlanningId: null,
            }
        default:
            return state
    }
}
/*eslint-enable*/

export default planningReducer
