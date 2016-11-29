const initialPlanning = {
    currentAgendaId: null,
    agendas: []
}

const planning = (state = initialPlanning, action) => {
    switch (action.type) {
        case 'SELECT_AGENDA':
            return Object.assign({}, state, { currentAgendaId: action.payload })
        case 'SET_AGENDAS':
            return Object.assign({}, state, { agendas: action.payload })
        default:
            return state
    }
}

export default planning
