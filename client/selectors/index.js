import { createSelector } from 'reselect'

const getCurrentAgendaId = (state) => state.planning.currentAgendaId
const getAgendas = (state) => state.planning.agendas
const getStoredPlannings = (state) => state.planning.plannings

export const getSelectedAgenda = createSelector(
    [getCurrentAgendaId, getAgendas],
    (currentAgendaId, agendas) => {
        if (agendas) {
            return agendas.find((a) => a._id === currentAgendaId)
        }
    }
)

export const getCurrentAgendaPlannings = createSelector(
    [getSelectedAgenda, getStoredPlannings],
    (currentAgenda, storedPlanningsObjects) => {
        const planningsIds = currentAgenda ? currentAgenda.planning_items || [] : []
        // from ids, return the actual plannings objects
        return planningsIds.map(
            (pid) => (storedPlanningsObjects[pid])
        ).filter((d) => d !== undefined) // remove undefined
    }
)
