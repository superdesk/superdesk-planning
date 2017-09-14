import { orderBy, cloneDeep, uniq, get } from 'lodash'
import moment from 'moment'
import { EVENTS, RESET_STORE, INIT_STORE, LOCKS, SPIKED_STATE } from '../constants'
import { createReducer } from '../utils'
import { WORKFLOW_STATE } from '../constants'

const initialLastRequest = { page: 1 }

const initialState = {
    events: {},
    eventsInList: [],
    search: {
        currentSearch: undefined,
        advancedSearchOpened: false,
    },
    lastRequestParams: initialLastRequest,
    show: true,
    showEventDetails: null,
    highlightedEvent: null,
    selectedEvents: [],
    readOnly: true,
    eventHistoryItems: [],
}

const modifyEventsBeingAdded = (state, payload) => {
    let _events = cloneDeep(state.events)

    payload.forEach((e) => {
        _events[e._id] = e
        // Change dates to moment objects
        if (e.dates) {
            e.dates.start = moment(e.dates.start)
            e.dates.end = moment(e.dates.end)
            if (get(e, 'dates.recurring_rule.until')) {
                e.dates.recurring_rule.until = moment(e.dates.recurring_rule.until)
            }
        }
    })

    return _events
}

const eventsReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [EVENTS.ACTIONS.SELECT_EVENTS]: (state, payload) => (
        {
            ...state,
            selectedEvents: uniq([...state.selectedEvents, ...payload]),
        }
    ),
    [EVENTS.ACTIONS.DESELECT_EVENT]: (state, payload) => (
        {
            ...state,
            selectedEvents: state.selectedEvents.filter((e) => e !== payload),
        }
    ),
    [EVENTS.ACTIONS.DESELECT_ALL_EVENT]: (state) => (
        {
            ...state,
            selectedEvents: [],
        }
    ),
    [EVENTS.ACTIONS.TOGGLE_EVENT_LIST]: (state) => (
        {
            ...state,
            show: !state.show,
        }
    ),
    [EVENTS.ACTIONS.REQUEST_EVENTS]: (state, payload) => (
        {
            ...state,
            lastRequestParams: {
                ...initialLastRequest,
                ...payload,
            },
            search: {
                ...state.search,
                currentSearch: payload,
            },
        }
    ),
    [EVENTS.ACTIONS.ADD_EVENTS]: (state, payload) => {
        const _events = modifyEventsBeingAdded(state, payload)

        return {
            ...state,
            events: _events,
        }
    },

    [EVENTS.ACTIONS.SET_EVENTS_LIST]: (state, payload) => (
        {
            ...state,
            eventsInList: orderBy(
                uniq([...payload, ...state.selectedEvents]),
                (e) => state.events[e].dates.start,
                ['desc']
            ),
        }
    ),
    [EVENTS.ACTIONS.ADD_TO_EVENTS_LIST]: (state, payload) => (
        eventsReducer(state, {
            type: EVENTS.ACTIONS.SET_EVENTS_LIST,
            payload: [...state.eventsInList, ...payload],
        })
    ),
    [EVENTS.ACTIONS.OPEN_ADVANCED_SEARCH]: (state) => (
        {
            ...state,
            search: {
                ...state.search,
                advancedSearchOpened: true,
            },
        }
    ),
    [EVENTS.ACTIONS.CLOSE_ADVANCED_SEARCH]: (state) => (
        {
            ...state,
            search: {
                ...state.search,
                advancedSearchOpened: false,
            },
        }
    ),
    [EVENTS.ACTIONS.PREVIEW_EVENT]: (state, payload) => (
        {
            ...state,
            showEventDetails: payload,
            highlightedEvent: payload,
        }
    ),
    [EVENTS.ACTIONS.OPEN_EVENT_DETAILS]: (state, payload) => (
        {
            ...state,
            showEventDetails: payload,
            highlightedEvent: payload,
            readOnly: false,
        }
    ),
    [EVENTS.ACTIONS.CLOSE_EVENT_DETAILS]: (state) => (
        {
            ...state,
            showEventDetails: null,
            readOnly: true,
        }
    ),
    [EVENTS.ACTIONS.RECEIVE_EVENT_HISTORY]: (state, payload) => (
        {
            ...state,
            eventHistoryItems: payload,
        }
    ),

    [EVENTS.ACTIONS.MARK_EVENT_CANCELLED]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event._id in state.events)) return state

        let events = cloneDeep(state.events)
        let event = events[payload.event._id]

        let definition = `------------------------------------------------------------
Event Cancelled
`

        if (get(payload, 'reason', null) !== null) {
            definition += `Reason: ${payload.reason}\n`
        }

        if (get(event, 'definition_long', null) !== null) {
            definition = `${event.definition_long}\n\n${definition}`
        }

        event.definition_long = definition
        event.state = WORKFLOW_STATE.CANCELLED
        event.occur_status = payload.occur_status
        event.lock_action = null
        event.lock_user = null
        event.lock_session = null
        event.lock_time = null

        return {
            ...state,
            events,
        }
    },

    [EVENTS.ACTIONS.MARK_EVENT_HAS_PLANNINGS]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event_item in state.events)) return state

        let events = cloneDeep(state.events)
        let event = events[payload.event_item]

        const planningIds = get(event, 'planning_ids', [])
        planningIds.push(payload.planning_item)
        event.planning_ids = planningIds

        return {
            ...state,
            events,
        }
    },

    [EVENTS.ACTIONS.LOCK_EVENT]: (state, payload) => {
        let events = cloneDeep(state.events)
        const newEvent = payload.event
        let event = get(events, newEvent._id, payload.event)

        event.lock_action = newEvent.lock_action
        event.lock_user = newEvent.lock_user
        event.lock_time = newEvent.lock_time
        event.lock_session = newEvent.lock_session
        event._etag = newEvent._etag

        return {
            ...state,
            events,
        }
    },

    [EVENTS.ACTIONS.UNLOCK_EVENT]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event._id in state.events)) return state

        let events = cloneDeep(state.events)
        const newEvent = payload.event
        let event = events[newEvent._id]

        delete event.lock_action
        delete event.lock_user
        delete event.lock_time
        delete event.lock_session
        event._etag = newEvent._etag

        return {
            ...state,
            events,
        }
    },

    [EVENTS.ACTIONS.MARK_EVENT_POSTPONED]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event._id in state.events)) return state

        let events = cloneDeep(state.events)
        let event = events[payload.event._id]

        let definition = `------------------------------------------------------------
Event Postponed
`

        if (get(payload, 'reason', null) !== null) {
            definition += `Reason: ${payload.reason}\n`
        }

        if (get(event, 'definition_long', null) !== null) {
            definition = `${event.definition_long}\n\n${definition}`
        }

        event.definition_long = definition
        event.state = WORKFLOW_STATE.POSTPONED
        event.lock_action = null
        event.lock_user = null
        event.lock_session = null
        event.lock_time = null

        return {
            ...state,
            events,
        }
    },

    [LOCKS.ACTIONS.RECEIVE]: (state, payload) => (
        get(payload, 'events.length', 0) <= 0 ?
            state :
            eventsReducer(state, {
                type: EVENTS.ACTIONS.ADD_EVENTS,
                payload: payload.events,
            })
    ),

    [EVENTS.ACTIONS.SPIKE_EVENT]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event._id in state.events)) return state

        let events = cloneDeep(state.events)
        const newEvent = payload.event
        let event = events[newEvent._id]

        delete event.lock_action
        delete event.lock_user
        delete event.lock_time
        delete event.lock_session
        event._etag = newEvent._etag
        event.state = newEvent.state
        event.revert_state = newEvent.revert_state

        let showEventDetails = get(state, 'showEventDetails', null)
        if (showEventDetails === event._id) {
            showEventDetails = null
        }

        // If the user is currently not showing spiked Events,
        // Then remove this Event from the list (if it exists in the list)
        const spikeState = get(state, 'search.currentSearch.spikeState', SPIKED_STATE.NOT_SPIKED)
        let eventsInList = state.eventsInList
        if (eventsInList.indexOf(event._id) > -1 && spikeState === SPIKED_STATE.NOT_SPIKED) {
            eventsInList.splice(eventsInList.indexOf(event._id), 1)
        }

        return {
            ...state,
            eventsInList,
            events,
            showEventDetails,
        }
    },

    [EVENTS.ACTIONS.UNSPIKE_EVENT]: (state, payload) => {
        // If the event is not loaded, disregard this action
        if (!(payload.event._id in state.events)) return state

        let events = cloneDeep(state.events)
        const newEvent = payload.event
        let event = events[newEvent._id]

        delete event.lock_action
        delete event.lock_user
        delete event.lock_time
        delete event.lock_session
        event._etag = newEvent._etag
        event.state = newEvent.state
        event.revert_state = newEvent.revert_state

        // If the user is currently showing spiked only Events,
        // Then remove this Event from the list (if it exists in the list)
        const spikeState = get(state, 'search.currentSearch.spikeState', SPIKED_STATE.NOT_SPIKED)
        let eventsInList = state.eventsInList
        if (eventsInList.indexOf(event._id) > -1 && spikeState === SPIKED_STATE.SPIKED) {
            eventsInList.splice(eventsInList.indexOf(event._id), 1)
        }

        return {
            ...state,
            eventsInList,
            events,
        }
    },
})

export default eventsReducer
