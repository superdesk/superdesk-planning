import { createSelector } from 'reselect'

const getCurrentAgendaId = (state) => state.planning.currentAgendaId
const getAgendas = (state) => state.planning.agendas

export const getSelectedAgenda = createSelector(
    [getCurrentAgendaId, getAgendas],
    (currentAgendaId, agendas) => {
        if (agendas) {
            return agendas.find((a) => a._id === currentAgendaId)
        }
    }
)
