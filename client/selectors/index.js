import { createSelector } from 'reselect'
import { orderBy, get, sortBy, includes, isEmpty } from 'lodash'
import moment from 'moment'
import { ITEM_STATE } from '../constants'

export const getAgendas = (state) => state.agenda.agendas
export const getCurrentPlanningId = (state) => state.planning.currentPlanningId
export const getPlanningHistory = (state) => state.planning.planningHistoryItems
export const eventSearchActive = (state) => (state.events.search.currentSearch.advancedSearch) ?
    true : false
export const getEvents = (state) => state.events.events
export const getEventHistory = (state) => state.events.eventHistoryItems
export const isEventListShown = (state) =>state.events.show
export const getPreviousEventRequestParams = (state) => get(state.events, 'lastRequestParams', {})
export const getPreviousPlanningRequestParams = (state) =>
    get(state.planning, 'lastRequestParams', {})
export const getCurrentAgendaId = (state) => state.agenda.currentAgendaId
export const getStoredPlannings = (state) => state.planning.plannings
export const getPlanningIdsInList = (state) => state.planning.planningsInList
export const isOnlyFutureFiltered = (state) => state.planning.onlyFuture
export const filterPlanningKeyword = (state) => state.planning.filterPlanningKeyword
export const isOnlySpikeFiltered = (state) => state.planning.onlySpiked
export const getServerUrl = (state) => state.config.server.url
export const getDateFormat = (state) => state.config.model.dateformat
export const getTimeFormat = (state) => state.config.shortTimeFormat
export const getIframelyKey = (state) => state.config.iframely ? state.config.iframely.key : null
export const getMaxRecurrentEvents = (state) => get(state, 'deployConfig.max_recurrent_events', 200)
export const getShowEventDetails = (state) => state.events.showEventDetails
export const getSelectedEvents = (state) => state.events.selectedEvents
export const getHighlightedEvent = (state) => state.events.highlightedEvent === true ? null :
    state.events.highlightedEvent
export const getEventsIdsToShowInList = (state) => state.events.eventsInList
export const getSelectedEventsObjects = createSelector(
    [getEvents, getSelectedEvents],
    (events, eventsIds) => (eventsIds.map((id) => events[id]))
)
export const getCurrentAgenda = createSelector(
    [getCurrentAgendaId, getAgendas],
    (currentAgendaId, agendas) => {
        if (agendas) {
            return agendas.find((a) => a._id === currentAgendaId)
        }
    }
)
export const getPrivileges = (state) => state.privileges
export const getUsers = (state) => get(state, 'users.length', 0) > 0 ? state.users : []
export const getPlanningItemReadOnlyState = (state) => state.planning.readOnly
export const getEventReadOnlyState = (state) => state.events.readOnly
export const getSessionDetails = (state) => state.session
export const getEventCalendars = (state) => get(state, 'vocabularies.event_calendars', [])

export const getPlanningsInList = createSelector(
    [getPlanningIdsInList, getStoredPlannings],
    (planningIds, storedPlannings) => (
        planningIds.map((pid) => (storedPlannings[pid]))
    )
)

// export const getCurrentAgendaPlannings = createSelector(
export const getFilteredPlanningList = createSelector(
    [getCurrentAgenda, getCurrentAgendaId, getPlanningsInList, isOnlyFutureFiltered, getEvents,
        filterPlanningKeyword, isOnlySpikeFiltered],
    (currentAgenda, currentAgendaId, planningsInList, isOnlyFutureFiltered, events,
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

        let plannings = []

        if (currentAgenda && currentAgenda._id) {
            plannings = planningsInList.filter(
                (planning) => includes(planning.agendas, currentAgenda._id)
            )
        } else if (currentAgendaId) {
            plannings = planningsInList.filter(
                (planning) => !planning.agendas || isEmpty(planning.agendas)
            )
        }

        plannings = plannings
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

export const getFilteredPlanningListEvents = createSelector(
    [getFilteredPlanningList, getEvents],
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
    [getCurrentPlanningId, getStoredPlannings, getAgendas],
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
        const days = {}
        function addEventToDate(event, date) {
            date = date || event.dates.start
            date = date.format('YYYY-MM-DD')
            // if not in search mode, only add dates from today on
            if (!eventSearchActive) {
                let now = moment()
                if (!moment(date).isSameOrAfter(now.add(-1, 'days'))) {
                    return false
                }
            }

            if (!days[date]) {
                days[date] = []
            }

            days[date].push(event)
        }

        events.forEach((event) => {
            // compute the number of days of the event
            if (!event.dates.start.isSame(event.dates.end, 'day')) {
                let deltaDays = Math.max(event.dates.end.diff(event.dates.start, 'days'), 1)
                // if the event happens during more that one day, add it to every day
                // add the event to the other days
                for (let i = 1; i <= deltaDays; i++) {
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
        sortable = sortBy(sortable, [(e) => (e.date)])

        // restructure to set a `date` field only for the first event of a day
        sortable = Array.prototype.concat(...sortable.map((day) => ([
            {
                event: day.events[0],
                date: day.date,
            },
            ...day.events.slice(1).map((event) => ({ event })),
        ])))

        return sortable
    }
)

/** Used for event details */
export const getEventToBeDetailed = createSelector(
    [getShowEventDetails, getEvents, getStoredPlannings, getAgendas],
    (showEventDetails, events, plannings, agendas) => {
        const event = events[showEventDetails]
        if (event) {
            return {
                ...event,
                _plannings: Object.keys(plannings).filter((pKey) => (
                    plannings[pKey].event_item === showEventDetails
                )).map((key) => ({
                    ...plannings[key],
                    _agendas: !plannings[key].agendas ? [] :
                        plannings[key].agendas.map((id) =>
                            agendas.find((agenda => agenda._id === id))),
                })),
            }
        }
    }
)

/** Returns the list of Agendas that are assigned to planning items */
export const getPlanningItemAgendas = createSelector(
    [getAgendas, getCurrentPlanning],
    (agendas, planning) => (
       agendas.filter((a) => includes(planning.agendas || [], a._id))
    )
)

/** Returns the list of Agendas that are `enabled` */
export const getEnabledAgendas = createSelector(
    [getAgendas],
    (agendas) => (
        agendas.filter((a) => a.is_enabled === true)
    )
)

/** Returns the list of Agendas that are not `disabled` */
export const getDisabledAgendas = createSelector(
    [getAgendas],
    (agendas) => (
        agendas.filter((a) => a.is_enabled === false)
    )
)

export const isCurrentPlanningLockedInThisSession = createSelector(
    [getCurrentPlanning, getSessionDetails],
    (currentPlanning, session) => (
            currentPlanning && currentPlanning.lock_user === session.identity._id &&
        currentPlanning.lock_session === session.sessionId ? true : false
    )
)

export const isEventDetailLockedInThisSession = createSelector(
    [getShowEventDetails, getEvents, getSessionDetails],
    (showEventDetails, events, session) => {
        const event = events[showEventDetails]
        return event && (event.lock_user === session.identity._id &&
        event.lock_session === session.sessionId) ? true : false
    }
)
