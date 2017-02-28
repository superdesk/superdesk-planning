import { cloneDeep } from 'lodash'

const replaceOrAddInAgendas = (agendas, agenda) => {
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
    let plannings = cloneDeep(state.plannings)
    delete plannings[pid]
    return { ...state, plannings }
}

/*eslint-disable complexity*/
const planning = (state={}, action) => {
    switch (action.type) {
        case 'DELETE_PLANNING':
            return deletePlanningId(action.payload, state)
        case 'RECEIVE_PLANNINGS':
            // payload must be an array. If not, we transform
            action.payload = Array.isArray(action.payload) ? action.payload : [action.payload]
            // clone plannings
            var plannings = cloneDeep(state.plannings)
            // add to state.plannings, use _id as key
            action.payload.forEach((planning) => plannings[planning._id] = planning)
            // return new state
            return { ...state, plannings, planningsAreLoading: false }
        case 'SELECT_AGENDA':
            return { ...state, currentAgendaId: action.payload }
        case 'REQUEST_AGENDAS':
            return { ...state, agendasAreLoading: true }
        case 'REQUEST_AGENDA_PLANNNGS':
            return { ...state, planningsAreLoading: true }
        case 'RECEIVE_AGENDAS':
            return { ...state, agendasAreLoading: false, agendas: action.payload }
        case 'ADD_OR_REPLACE_AGENDA':
            return {
                ...state,
                agendas: replaceOrAddInAgendas(state.agendas.slice(), action.payload)
            }
        case 'OPEN_PLANNING_EDITOR':
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: action.payload
            }
        case 'CLOSE_PLANNING_EDITOR':
            return { ...state, editorOpened: false, currentPlanningId: null }
        default:
            return state
    }
}
/*eslint-enable*/

export default planning
