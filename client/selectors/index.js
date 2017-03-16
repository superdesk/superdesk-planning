import { createSelector } from 'reselect'
import { sortBy } from 'lodash'

const getAgendas = (state) => state.planning.agendas
export const getCurrentPlanningId = (state) => state.planning.currentPlanningId
export const getEvents = (state) => state.events.events
export const getCurrentAgendaId = (state) => state.planning.currentAgendaId
export const getStoredPlannings = (state) => state.planning.plannings
export const getServerUrl = (state) => state.config.server.url
export const getIframelyKey = (state) => state.config.iframely ? state.config.iframely.key : null

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
        return sortBy(
            planningsIds.map(
                (pid) => (storedPlanningsObjects[pid])
            )
            .filter((d) => d !== undefined), // remove undefined
        [(p) => (-p._created)]) // sort by new created first, or by name
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

export const getEventsWithMoreInfo = createSelector(
    [getEvents, getStoredPlannings],
    (events, storedPlannings) => {
        function hasPlanning(event) {
            return storedPlannings && Object.keys(storedPlannings).some((planningKey) => (
                storedPlannings[planningKey].event_item &&
                storedPlannings[planningKey].event_item._id === event._id
            ))
        }

        return events.map((event) => ({
            ...event,
            _hasPlanning: hasPlanning(event),
            _type: 'events', // _type can disapear in the object, like in a POST response
        }))
    }
)
