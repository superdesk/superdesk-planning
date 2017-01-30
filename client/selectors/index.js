import { createSelector } from 'reselect'

const getAgendas = (state) => state.planning.agendas
export const getCurrentPlanningId = (state) => state.planning.currentPlanningId
export const getEvents = (state) => state.events.events
export const getCurrentAgendaId = (state) => state.planning.currentAgendaId
export const getStoredPlannings = (state) => state.planning.plannings
export const getServerUrl = (state) => state.config.server.url

export const getCurrentAgenda = createSelector(
    [getCurrentAgendaId, getAgendas],
    (currentAgendaId, agendas) => {
        if (agendas) {
            return agendas.find((a) => a._id === currentAgendaId)
        }
    }
)

export const getCurrentAgendaPlannings = createSelector(
    [getCurrentAgenda, getStoredPlannings],
    (currentAgenda, storedPlanningsObjects) => {
        const planningsIds = currentAgenda ? currentAgenda.planning_items || [] : []
        // from ids, return the actual plannings objects
        return planningsIds.map(
            (pid) => (storedPlanningsObjects[pid])
        ).filter((d) => d !== undefined) // remove undefined
    }
)

export const getCurrentPlanning = createSelector(
    [getCurrentPlanningId, getStoredPlannings],
    (currentPlanningId, storedPlannings) => {
        if (currentPlanningId) {
            return storedPlannings[currentPlanningId]
        }
    }
)
