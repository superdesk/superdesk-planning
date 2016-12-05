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

const initialPlanning = {
    currentAgendaId: null,
    editorOpened: false,
    agendas: [],
    agendasAreLoading: false,
    plannings: {}, // plannings stored by _id
}

const planning = (state = initialPlanning, action) => {
    switch (action.type) {
        case 'ADD_PLANNINGS':
            // payload must be an array. If not, we transform
            action.payload = Array.isArray(action.payload) ? action.payload : [action.payload]
            // clone plannings
            var plannings = cloneDeep(state.plannings)
            // add to state.plannings, use _id as key
            action.payload.forEach((planning) => plannings[planning._id] = planning)
            // return new state
            return Object.assign({}, state, { plannings: plannings })
        case 'SELECT_AGENDA':
            return Object.assign({}, state, { currentAgendaId: action.payload })
        case 'REQUEST_AGENDAS':
            return Object.assign({}, state, { agendasAreLoading: true })
        case 'RECEIVE_AGENDAS':
            return Object.assign({}, state, { agendasAreLoading: false, agendas: action.payload })
        case 'ADD_OR_REPLACE_AGENDA':
            return Object.assign({}, state, {
                agendas: replaceOrAddInAgendas(state.agendas.slice(), action.payload)
            })
        case 'OPEN_PLANNING_EDITOR':
            return Object.assign({}, state, { editorOpened: true })
        case 'CLOSE_PLANNING_EDITOR':
            return Object.assign({}, state, { editorOpened: false })
        default:
            return state
    }
}

export default planning
