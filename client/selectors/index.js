import { createSelector } from 'reselect'
import { orderBy } from 'lodash'

const getAgendas = (state) => state.planning.agendas
export const getCurrentPlanningId = (state) => state.planning.currentPlanningId
export const getEvents = (state) => state.events.events
export const getCurrentAgendaId = (state) => state.planning.currentAgendaId
export const getStoredPlannings = (state) => state.planning.plannings
export const getServerUrl = (state) => state.config.server.url
export const getIframelyKey = (state) => state.config.iframely ? state.config.iframely.key : null
export const getShowEventDetails = (state) => state.events.showEventDetails

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
        return orderBy(
            planningsIds.map((pid) => (storedPlanningsObjects[pid]))
            .filter((d) => d !== undefined), // remove undefined
        ['_created'], ['desc']) // sort by new created first, or by name
    }
)

export const getCurrentAgendaPlanningsEvents = createSelector(
    [getCurrentAgendaPlannings, getEvents],
    (plannings, events) => {
        const eventsByPlanningId = {}
        plannings.forEach((p) => {
            const e = events.find((e) => e._id === p.event_item)
            if (e) {
                eventsByPlanningId[p._id] = e
            }
        })
        return eventsByPlanningId
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

export const getCurrentPlanningEvent = createSelector(
    [getCurrentPlanning, getEvents],
    (planning, events) => planning && events.find((e) => e._id === planning.event_item)
)

/** Used for the events list */
export const getEventsWithMoreInfo = createSelector(
    [getEvents, getStoredPlannings],
    (events, storedPlannings) => {
        function hasPlanning(event) {
            return storedPlannings && Object.keys(storedPlannings).some((planningKey) => (
                storedPlannings[planningKey].event_item === event._id
            ))
        }

        return events.map((event) => ({
            ...event,
            _hasPlanning: hasPlanning(event),
            _type: 'events', // _type can disapear in the object, like in a POST response
        }))
    }
)

/** Used for event details */
export const getEventToBeDetailed = createSelector(
    [getShowEventDetails, getEvents, getStoredPlannings, getAgendas],
    (showEventDetails, events, storedPlannings, agendas) => {
        const event = events.find((e) => e._id === showEventDetails)
        if (event) {
            return {
                ...event,
                _plannings: Object.keys(storedPlannings).filter((pKey) => (
                    storedPlannings[pKey].event_item === showEventDetails
                )).map((pKey) => ({
                    ...storedPlannings[pKey],
                    _agenda: agendas.find((a) => a.planning_items.indexOf(pKey) > -1),
                })),
            }
        }
    }
)
