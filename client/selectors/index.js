import { createSelector } from 'reselect'
import { get, sortBy, includes, isEmpty } from 'lodash'
import moment from 'moment'
import { AGENDA, SPIKED_STATE } from '../constants'
import { isItemLockedInThisSession, isItemSpiked } from '../utils'

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

export const getAssignments = (state) => state.assignment.assignments
export const getFilterBy = (state) => state.assignment.filterBy
export const getSearchQuery = (state) => state.assignment.searchQuery
export const getOrderByField = (state) => state.assignment.orderByField
export const getOrderDirection = (state) => state.assignment.orderDirection
export const getSelectedAssignments = (state) => state.assignment.selectedAssignments
export const getAssignmentListSettings = (state) => ({
    filterBy: getFilterBy(state),
    searchQuery: getSearchQuery(state),
    orderByField: getOrderByField(state),
    orderDirection: getOrderDirection(state),
    lastAssignmentLoadedPage: state.assignment.lastAssignmentLoadedPage,
})
export const getMyAssignmentsCount = (state) => {
    const assignments = getAssignments(state)
    const currentUserId = getCurrentUserId(state)

    return assignments.reduce((previousValue, assignment) =>
        previousValue + (assignment.planning.assigned_to.user === currentUserId ? 1 : 0),
    0)
}

export const getPrivileges = (state) => state.privileges
export const getUsers = (state) => get(state, 'users.length', 0) > 0 ? state.users : []
export const getPlanningItemReadOnlyState = (state) => state.planning.readOnly
export const getEventReadOnlyState = (state) => state.events.readOnly
export const getSessionDetails = (state) => state.session
export const getCurrentUserId = (state) => state.session.identity._id
export const getEventCalendars = (state) => get(state, 'vocabularies.event_calendars', [])

export const getPlanningSearch = (state) => state.planning.search.currentSearch
export const getEventsFormsProfile = (state) => state.formsProfile.events
export const getPlanningsFormsProfile = (state) => state.formsProfile.planning
export const getCoverageFormsProfile = (state) => state.formsProfile.coverage
export const getPlanningsInList = createSelector(
    [getPlanningIdsInList, getStoredPlannings],
    (planningIds, storedPlannings) => (
        planningIds.map((pid) => (storedPlannings[pid]))
    )
)

export const getFilteredPlanningList = createSelector(
    [getCurrentAgenda, getCurrentAgendaId, getPlanningsInList, getPlanningSearch],
    (currentAgenda, currentAgendaId, planningsInList, currentSearch) => {

        let plannings = planningsInList

        if (currentAgenda && currentAgenda._id) {
            plannings = planningsInList.filter(
                (planning) => includes(planning.agendas, currentAgenda._id)
            )
        } else if (currentAgendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED) {
            plannings = planningsInList.filter(
                (planning) => !planning.agendas || isEmpty(planning.agendas)
            )
        }

        let onlySpike = get(currentSearch, 'spikeState') === SPIKED_STATE.SPIKED

        return plannings.filter((p) =>
            (onlySpike && isItemSpiked(p)) ||
            (!onlySpike && !isItemSpiked(p))
        )
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
        currentPlanning && isItemLockedInThisSession(currentPlanning, session)
    )
)

export const isEventDetailLockedInThisSession = createSelector(
    [getShowEventDetails, getEvents, getSessionDetails],
    (showEventDetails, events, session) => {
        const event = events[showEventDetails]
        return event && isItemLockedInThisSession(event, session)
    }
)

export const getPlanningFilterParams = createSelector(
    [getCurrentAgendaId, getCurrentAgenda, getPlanningSearch,
        filterPlanningKeyword, isOnlyFutureFiltered],
    (agendaId, agenda, planningSearch, filterKeyword, onlyFuture) => {
        const params = {
            noAgendaAssigned: agendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED,
            agendas: agenda ? [agenda._id] : null,
            page: 1,
            advancedSearch: get(planningSearch, 'advancedSearch', {}),
            spikeState: get(planningSearch, 'spikeState', SPIKED_STATE.NOT_SPIKED),
            fulltext: filterKeyword,
            onlyFuture: onlyFuture,
        }

        return params
    }
)

export const isAdvancedDateSearch = createSelector(
    [getPlanningSearch], (currentSearch) => (
        !!get(currentSearch, 'advancedSearch.dates.range', false)
    )
)
