import {sortBy} from 'lodash';

import {IAgendaState} from '../interfaces';
import {AGENDA, RESET_STORE, INIT_STORE} from '../constants';

/**
 * Creates a new agenda if it doesn't exist, otherwise updates the existing one
 * @param {array, object} agendas - Array of current loaded Agendas
 * @param {object} agenda - The Agenda to create or update
 * @return {*}
 */
const replaceOrAddInAgendas = (agendas, agenda) => {
    const index = agendas.findIndex((a) => a._id === agenda._id);

    if (index === -1) {
        agendas.push(agenda);
    } else {
        agendas.splice(index, 1, agenda);
    }

    return sortBy(agendas, [(a) =>
        a.name.toLowerCase(),
    ]);
};

const initialState: IAgendaState = {
    agendas: [],
    currentPlanningId: undefined,
    currentAgendaId: null,
    currentFilterId: null,
    agendasAreLoading: false,
};

const agendaReducer = (state = initialState, action) => {
    switch (action.type) {
    case RESET_STORE:
        return initialState;
    case INIT_STORE:
        return initialState;
    case AGENDA.ACTIONS.REQUEST_AGENDAS:
        return {
            ...state,
            agendasAreLoading: true,
        };
    case AGENDA.ACTIONS.RECEIVE_AGENDAS:
        return {
            ...state,
            agendasAreLoading: false,
            agendas: action.payload,
        };
    case AGENDA.ACTIONS.SELECT_AGENDA:
        return {
            ...state,
            currentAgendaId: action.payload,
            currentFilterId: null,
        };
    case AGENDA.ACTIONS.SELECT_FILTER:
        return {
            ...state,
            currentAgendaId: null,
            currentFilterId: action.payload,
        };
    case AGENDA.ACTIONS.ADD_OR_REPLACE_AGENDA:
        return {
            ...state,
            agendas: replaceOrAddInAgendas(state.agendas.slice(), action.payload),
        };
    default:
        return state;
    }
};

export default agendaReducer;
