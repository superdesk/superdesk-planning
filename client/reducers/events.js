import { orderBy, cloneDeep, uniq, get } from 'lodash'
import moment from 'moment'
import { EVENTS } from '../constants'
import { createReducer } from '../utils'

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
}

const eventsReducer = createReducer(initialState, {
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
        var _events = cloneDeep(state.events)
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
        return {
            ...state,
            events: _events,
        }
    },

    [EVENTS.ACTIONS.SET_EVENTS_LIST]: (state, payload) => (
        {
            ...state,
            eventsInList: orderBy(payload, (e) => (
                state.events[e].dates.start
            ), ['desc']),
        }
    ),
    [EVENTS.ACTIONS.ADD_TO_EVENTS_LIST]: (state, payload) => (
        eventsReducer(state, {
            type: EVENTS.ACTIONS.SET_EVENTS_LIST,
            payload: uniq([...state.eventsInList, ...payload]),
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
            selectedEvent: payload,
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
})

export default eventsReducer
