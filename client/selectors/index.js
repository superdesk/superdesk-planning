import { createSelector } from 'reselect'
import { get, sortBy, includes, isEmpty, filter, matches, isNil } from 'lodash'
import moment from 'moment'
import { AGENDA, SPIKED_STATE, WORKSPACE } from '../constants'
import { isItemLockedInThisSession, isItemSpiked } from '../utils'

export const getIngestProviders = (state) => get(state, 'ingest.providers')
export const getAgendas = (state) => get(state, 'agenda.agendas', [])
export const getCurrentPlanningId = (state) => get(state, 'planning.currentPlanningId')
export const getPlanningHistory = (state) => get(state, 'planning.planningHistoryItems')
export const eventSearchActive = (state) => !!get(
    state,
    'events.search.currentSearch.advancedSearch',
    false
)
export const getEvents = (state) => get(state, 'events.events', {})
export const getEventHistory = (state) => get(state, 'events.eventHistoryItems')
export const isEventListShown = (state) => get(state, 'events.show')
export const getPreviousEventRequestParams = (state) => get(state, 'events.lastRequestParams', {})
export const getPreviousPlanningRequestParams = (state) =>
    get(state, 'planning.lastRequestParams', {})
export const getCurrentAgendaId = (state) => get(state, 'agenda.currentAgendaId')
export const getStoredPlannings = (state) => get(state, 'planning.plannings')
export const getPlanningIdsInList = (state) => get(state, 'planning.planningsInList', [])
export const isOnlyFutureFiltered = (state) => get(state, 'planning.onlyFuture')
export const filterPlanningKeyword = (state) => get(state, 'planning.filterPlanningKeyword')
export const getServerUrl = (state) => get(state, 'config.server.url')
export const getDateFormat = (state) => get(state, 'config.model.dateformat')
export const getTimeFormat = (state) => get(state, 'config.shortTimeFormat')
export const getIframelyKey = (state) => get(state, 'config.iframely.key', null)
export const getMaxRecurrentEvents = (state) => get(state, 'deployConfig.max_recurrent_events', 200)
export const getShowEventDetails = (state) => get(state, 'events.showEventDetails')
export const getSelectedEvents = (state) => get(state, 'events.selectedEvents', [])
export const getHighlightedEvent = (state) => get(state, 'events.highlightedEvent') === true ?
    null : get(state, 'events.highlightedEvent')
export const getEventsIdsToShowInList = (state) => get(state, 'events.eventsInList', [])
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

export const getCurrentModalType = (state) => get(state, 'modal.modalType', null)
export const getCurrentModalProps = (state) => get(state, 'modal.modalProps', {})
export const getModalActionInProgress = (state) => get(state, 'modal.actionInProgress', false)
export const planningEditorOpened = (state) => get(state, 'planning.editorOpened', false)
export const planningEditorReadOnly = (state) => get(state, 'planning.readOnly', true)

export const getStoredAssignments = (state) => get(state, 'assignment.assignments', {})
export const getAssignmentsInList = (state) => get(state, 'assignment.assignmentsInList', [])
export const getFilterBy = (state) => get(state, 'assignment.filterBy', 'ALL')
export const getSearchQuery = (state) => get(state, 'assignment.searchQuery', null)
export const getOrderByField = (state) => get(state, 'assignment.orderByField', 'Created')
export const getOrderDirection = (state) => get(state, 'assignment.orderDirection', 'Asc')
export const getAssignmentFilterByState = (state) => get(state, 'assignment.filterByState', null)
export const getAssignmentFilterByType = (state) => get(state, 'assignment.filterByType', null)
export const getAssignmentFilterByPriority = (state) =>
    get(state, 'assignment.filterByPriority', null)
export const getAssignmentPage = (state) => get(state, 'assignment.lastAssignmentLoadedPage', 1)
export const getAssignmentListSettings = (state) => ({
    filterBy: getFilterBy(state),
    searchQuery: getSearchQuery(state),
    orderByField: getOrderByField(state),
    orderDirection: getOrderDirection(state),
    lastAssignmentLoadedPage: getAssignmentPage(state),
    filterByState: getAssignmentFilterByState(state),
    filterByType: getAssignmentFilterByType(state),
    filterByPriority: getAssignmentFilterByPriority(state),
})

export const getPrivileges = (state) => get(state, 'privileges')
export const getUsers = (state) => get(state, 'users', [])
export const getPlanningItemReadOnlyState = (state) => get(state, 'planning.readOnly')
export const getEventReadOnlyState = (state) => get(state, 'events.readOnly')
export const getSessionDetails = (state) => get(state, 'session')
export const getCurrentUserId = (state) => get(state, 'session.identity._id')
export const getPreviewAssignmentOpened = (state) => get(state, 'assignment.previewOpened')
export const getCurrentAssignmentId = (state) => get(state, 'assignment.currentAssignmentId')
export const getReadOnlyAssignment = (state) => get(state, 'assignment.readOnly')
export const getFulFilledItem = (state) => get(state, 'assignment.fulfilledItem', {})

export const getEventCalendars = (state) => get(state, 'vocabularies.event_calendars', [])
export const getKeywords = (state) => get(state, 'vocabularies.keywords', [])
export const getPlanningSearch = (state) => get(state, 'planning.search.currentSearch')
export const getFormsProfile = (state) => get(state, 'formsProfile')
export const getEventsFormsProfile = (state) => get(state, 'formsProfile.events')
export const getPlanningsFormsProfile = (state) => get(state, 'formsProfile.planning')
export const getCoverageFormsProfile = (state) => get(state, 'formsProfile.coverage')
export const getCoverageCancelState = (state) =>
    (get(state, 'vocabularies.newscoveragestatus', []).find((s) => s.qcode === 'ncostat:notint'))
export const getVocabularies = (state) => get(state, 'vocabularies')
export const getAssignmentPriorities = (state) => get(state, 'vocabularies.assignment_priority', [])
export const getSelectedPlanningItems = (state) => get(state, 'planning.selectedItems')
export const getLockedItems = (state) => get(state, 'locks', {
    events: {},
    planning: {},
    recurring: {},
    assignments: {},
})
export const getCurrentWorkspace = (state) => get(state, 'workspace.currentWorkspace', null)
export const getContentTypes = (state) => get(state, 'vocabularies.g2_content_type', [])

export const getCurrentDeskId = (state) => get(state, 'workspace.currentDeskId', null)
export const getCurrentStageId = (state) => get(state, 'workspace.currentStageId', null)
export const getDesks = (state) => get(state, 'desks', [])
export const getTemplates = (state) => get(state, 'templates', [])

export const getPlanningTypeProfile = createSelector(
    [getPlanningsFormsProfile, getCoverageFormsProfile],
    (planningProfile, coverageProfile) => (
        {
            planning: planningProfile,
            coverage: coverageProfile,
        }
    )
)

export const getAssignments = createSelector(
    [getAssignmentsInList, getStoredAssignments],
    (assignmentIds, storedAssignments) => (
        assignmentIds.map((aid) => (storedAssignments[aid]))
    )
)

export const getMyAssignmentsCount = createSelector(
    [getAssignments, getCurrentUserId],
    (assignments, userId) => {
        if (assignments && userId) {
            return assignments.reduce((previousValue, assignment) =>
                previousValue + (
                    get(assignment, 'assigned_to.user') === userId ? 1 : 0
                ), 0
            )
        }
    }
)

export const getCurrentAssignment = createSelector(
    [getCurrentAssignmentId, getStoredAssignments],
    (assignmentId, storedAssignments) => (
        get(storedAssignments, assignmentId, null)
    )
)

export const getCurrentAssignmentPlanningItem = createSelector(
    [getCurrentAssignment, getStoredPlannings],
    (assignment, storedPlannings) => (
        assignment ?
            get(storedPlannings, assignment.planning_item) :
            null
    )
)

export const getCurrentAssignmentEventItem = createSelector(
    [getCurrentAssignmentPlanningItem, getEvents],
    (planning, storedEvents) => (
        planning ?
            get(storedEvents, planning.event_item) :
            null
    )
)

export const getCoverageProviders = createSelector(
    [getVocabularies],
    (vocabularies) => {
        if (!vocabularies.coverage_providers) {
            return []
        }

        return vocabularies.coverage_providers
    }
)

export const getUsersMergedCoverageProviders = createSelector(
    [getUsers, getVocabularies],
    (users, vocabularies) => {
        if (!vocabularies.coverage_providers) {
            return users
        }

        let mergedUsers = users
        vocabularies.coverage_providers.forEach((provider) => {
            mergedUsers.push({
                _id: provider.qcode,
                display_name: provider.name,
                provider: true,
            })
        })

        return mergedUsers
    }
)

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

        if (get(currentSearch, 'spikeState') === SPIKED_STATE.SPIKED) {
            return plannings.filter((p) => isItemSpiked(p))
        } else if (get(currentSearch, 'spikeState') === SPIKED_STATE.BOTH) {
            return plannings
        } else {
            return plannings.filter((p) => !isItemSpiked(p))
        }
    }
)

export const getFilteredPlanningListEvents = createSelector(
    [getFilteredPlanningList, getEvents],
    (plannings, events) => {
        const eventsByPlanningId = {}
        plannings.forEach((p) => {
            const e = get(events, p.event_item)
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
        if (typeof currentPlanningId === 'string') {
            return storedPlannings[currentPlanningId]
        } else if (typeof currentPlanningId === 'object') {
            return currentPlanningId
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
    (events, storedPlannings, eventsIdsToBeShown) =>(
        eventsIdsToBeShown.map((eventId) => ({
            ...events[eventId],
            _type: 'events', // _type can disappear in the obejct, like in a POST response
        }))
    )
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
        const event = events ? events[showEventDetails] : null
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

/** Returns the list of currently locked planning items */
export const getLockedPlannings = createSelector(
    [getStoredPlannings, getCurrentUserId],
    (plannings, userId) => filter(plannings, matches({
        lock_user: userId,
        lock_action: 'edit',
    }))
)

/** Returns the list of currently locked events */
export const getLockedEvents = createSelector(
    [getEvents, getCurrentUserId],
    (events, userId) => (
        filter(events, (e) => (
                !isNil(e.lock_session) && e.lock_action === 'edit' && e.lock_user === userId
            )
        )
    )
)

export const getAssignmentSearch = createSelector(
    [getAssignmentListSettings, getCurrentDeskId, getCurrentUserId,
        getAssignmentFilterByState, getCurrentWorkspace, getAssignmentFilterByType,
        getAssignmentFilterByPriority],
    (listSettings, currentDeskId,
     currentUserId, filterByState, currentWorkspace, filterByType, filterByPriority) => {
        const assignmentSearch = {
            deskId: (
                get(listSettings, 'filterBy') === 'All' ||
                currentWorkspace === WORKSPACE.AUTHORING
            ) ? currentDeskId : null,
            userId: (get(listSettings, 'filterBy') === 'User') ? currentUserId : null,
            searchQuery: get(listSettings, 'searchQuery', ''),
            orderByField: get(listSettings, 'orderByField', 'Created'),
            orderDirection: get(listSettings, 'orderDirection', 'Asc'),
            page: 1,
            state: filterByState,
            type: filterByType,
            priority: filterByPriority,
        }

        return assignmentSearch
    }
)
