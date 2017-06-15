import { createSelector } from 'reselect'
import { orderBy, get, sortBy } from 'lodash'
import { isAllDay } from '../utils'
import moment from 'moment'
import { ITEM_STATE } from '../constants'

export const getAgendas = (state) => state.agenda.agendas
export const getCurrentPlanningId = (state) => state.planning.currentPlanningId
export const eventSearchActive = (state) => (
    state.events.search.currentSearch.advancedSearch ||
    state.events.search.currentSearch.fulltext) ?
    true : false
export const getEvents = (state) => state.events.events
export const isEventListShown = (state) =>state.events.show
export const getPreviousEventRequestParams = (state) => get(state.events, 'lastRequestParams', {})
export const getCurrentAgendaId = (state) => state.agenda.currentAgendaId
export const getStoredPlannings = (state) => state.planning.plannings
export const isOnlyFutureFiltered = (state) => state.planning.onlyFuture
export const filterPlanningKeyword = (state) => state.planning.filterPlanningKeyword
export const isOnlySpikeFiltered = (state) => state.planning.onlySpiked
export const getServerUrl = (state) => state.config.server.url
export const getDateFormat = (state) => state.config.model.dateformat
export const getTimeFormat = (state) => state.config.shortTimeFormat
export const getIframelyKey = (state) => state.config.iframely ? state.config.iframely.key : null
export const getShowEventDetails = (state) => state.events.showEventDetails
export const getSelectedEvent = (state) => state.events.selectedEvent === true ? null :
    state.events.selectedEvent
export const getEventsIdsToShowInList = (state) => state.events.eventsInList
export const getCurrentAgenda = createSelector(
    [getCurrentAgendaId, getAgendas],
    (currentAgendaId, agendas) => {
        if (agendas) {
            return agendas.find((a) => a._id === currentAgendaId)
        }
    }
)
export const getPrivileges = (state) => state.privileges
export const getUsers = (state) => state.users
export const getPlanningItemReadOnlyState = (state) => state.planning.readOnly
export const getEventReadOnlyState = (state) => state.events.readOnly

export const getCurrentAgendaPlannings = createSelector(
    [getCurrentAgenda, getStoredPlannings, isOnlyFutureFiltered, getEvents,
        filterPlanningKeyword, isOnlySpikeFiltered],
    (currentAgenda, storedPlanningsObjects, isOnlyFutureFiltered, events,
        filterPlanningKeyword, isOnlySpikeFiltered) => {
        /** Return true if the planning has a future scheduled due date for a coverage
        or an associated event with a future end date.
        see: https://dev.sourcefabric.org/browse/SDESK-1103
        */
        function isFuture(planning) {
            const endDate = get(events[planning.event_item], 'dates.end')
            // planning has no coverage due date and no event ending date
            if (!endDate && !get(planning, 'coverages', []).some(
                (c) => (get(c, 'planning.scheduled'))
            )) {
                return true
            }
            // event ending date is future
            else if (endDate && endDate.isSameOrAfter(new Date(), 'day')) {
                return true
            }
            // or a coverage due date is future
            else if (get(planning, 'coverages', []).some((c) => (
                    moment(c.planning.scheduled).isSameOrAfter(new Date(), 'day')
            ))) {
                return true
            }
            // it's an old planning
            return false
        }

        function freetextSearch(planning) {
            // compose a string with the fields we want to seach in.
            const textToSearchIn = `
                ${JSON.stringify(planning)}
                ${JSON.stringify(events[planning.event_item])}
            `.toLowerCase()
            return filterPlanningKeyword
                .toLowerCase()
                .split(' ').every((keyword) => (
                    textToSearchIn.indexOf(keyword) !== -1
                ))
        }

        const planningsIds = currentAgenda ? currentAgenda.planning_items || [] : []
        const plannings = planningsIds
        // from ids, get the actual plannings objects
        .map((pid) => (storedPlanningsObjects[pid]))
        // remove undefined
        .filter((p) => p !== undefined)
        // if "only future" filter is enabled, keep only future planning
        .filter((p) => !isOnlyFutureFiltered || isFuture(p))
        // filter by keyword
        .filter((p) => !filterPlanningKeyword || freetextSearch(p))
        // if "only active" filter is enabled, keep only active planning
        .filter((p) =>
            (isOnlySpikeFiltered && p.state === ITEM_STATE.SPIKED) ||
            (!isOnlySpikeFiltered && p.state !== ITEM_STATE.SPIKED)
        )
        // sort by new created first, or by name
        return orderBy(plannings, ['_created'], ['desc'])
    }
)

export const getCurrentAgendaPlanningsEvents = createSelector(
    [getCurrentAgendaPlannings, getEvents],
    (plannings, events) => {
        const eventsByPlanningId = {}
        plannings.forEach((p) => {
            const e = events[p.event_item]
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
    (planning, events) => planning && events[planning.event_item]
)

/** Return true if the current Planning Agenda is Spiked, false otherwise */
export const getCurrentPlanningAgendaSpiked = createSelector(
    [getCurrentPlanningId, getAgendas],
    (currentPlanningId, agendas) => {
        if (currentPlanningId && agendas) {
            let agenda = agendas.find((a) => (
                a.planning_items && a.planning_items.indexOf(currentPlanningId) > -1
            ))

            if (agenda && 'state' in agenda) {
                return agenda.state === ITEM_STATE.SPIKED
            }
        }

        return false
    }
)

/** Used for the events list */
export const getEventsWithMoreInfo = createSelector(
    [getEvents, getStoredPlannings, getEventsIdsToShowInList],
    (events, storedPlannings, eventsIdsToBeShown) => {
        function hasPlanning(event) {
            return storedPlannings && Object.keys(storedPlannings).some((planningKey) => (
                storedPlannings[planningKey].event_item === event._id
            ))
        }

        return eventsIdsToBeShown.map((eventId) => {
            const event = events[eventId]
            if (!event) throw Error(`the event ${eventId} is missing in the store`)
            return {
                ...event,
                _hasPlanning: hasPlanning(event),
                _type: 'events', // _type can disapear in the object, like in a POST response
            }
        })
    }
)

/**
* Will produce an array of days, which contain the day date and
* the associated events.
*/
export const getEventsOrderedByDay = createSelector(
    [eventSearchActive, getEventsWithMoreInfo],
    (eventSearchActive, events) => {
        if (!events) return []
        // check if search exists
        // order by date
        events = events.sort((a, b) => a.dates.start - b.dates.start)
        var days = {}
        function addEventToDate(event, date) {
            date = date || event.dates.start
            date = date.format('YYYY-MM-DD')
            // if not in search mode, only add dates in the future
            if (!eventSearchActive) {
                let now = moment()
                if (!moment(date).isSameOrAfter(now)) {
                    return false
                }
            }

            if (!days[date]) {
                days[date] = []
            }

            days[date].push(event)
        }

        events.forEach((event) => {
            // if the event happens during more that one day, add it to every day
            if (!isAllDay(event) && !event.dates.start.isSame(event.dates.end, 'day')) {
                // compute the number of days of the event
                var deltaDays = Math.max(event.dates.end.diff(event.dates.start, 'days'), 1)
                // add the event to the other days
                for (var i = 1; i <= deltaDays; i++) {
                    //  clone the date
                    const newDate = moment(event.dates.start)
                    newDate.add(i, 'days')
                    addEventToDate(event, newDate)
                }
            }
            // add event to its initial starting date
            addEventToDate(event)
        })

        let sortable = []
        for (let day in days) sortable.push({
            date: day,
            events: days[day],
        })

        return sortBy(sortable, [(e) => (e.date)])

    }
)

/** Used for event details */
export const getEventToBeDetailed = createSelector(
    [getShowEventDetails, getEvents, getStoredPlannings, getAgendas],
    (showEventDetails, events, storedPlannings, agendas) => {
        const event = events[showEventDetails]
        if (event) {
            return {
                ...event,
                _plannings: Object.keys(storedPlannings).filter((pKey) => (
                    storedPlannings[pKey].event_item === showEventDetails
                )).map((pKey) => ({
                    ...storedPlannings[pKey],
                    _agenda: agendas.find((a) => a.planning_items ?
                        a.planning_items.indexOf(pKey) > -1 : false),
                })),
            }
        }
    }
)

/** Returns the list of Agendas that are `spiked` */
export const getSpikedAgendas = createSelector(
    [getAgendas],
    (agendas) => (
        agendas.filter((a) => a.state === ITEM_STATE.SPIKED)
    )
)

/** Returns the list of Agendas that are not `spiked` */
export const getActiveAgendas = createSelector(
    [getAgendas],
    (agendas) => (
        agendas.filter((a) => a.state !== ITEM_STATE.SPIKED)
    )
)
