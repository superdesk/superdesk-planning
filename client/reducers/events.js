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
    eventHistoryItems: [],
}

const modifyEventsBeingAdded = (state, payload) => {
    var _events = cloneDeep(state.events)
    let updateRecurrences = []

    payload.forEach((e) => {
        _events[e._id] = e
        // Change dates to moment objects
        if (e.dates) {
            e.dates.start = moment(e.dates.start)
            e.dates.end = moment(e.dates.end)
            if (get(e, 'dates.recurring_rule.until')) {
                e.dates.recurring_rule.until = moment(e.dates.recurring_rule.until)
            }

            // We are not locking every event in the recurring series for efficiency reasons
            // However, backend manages to disallow lock if another recurrent event is locked
            // So, we have to superficially in the UI show that all events in the series are locked
            if (e.recurrence_id) {
                if (Object.keys(state.events).length > 0) {
                    // If it exists in store
                    const eventInStore = state.events[e._id]
                    if (eventInStore && e.lock_user !== eventInStore.lock_user) {
                        if (e.lock_user) {
                            updateRecurrences.push({
                                originalEventLocked: e._id,
                                recurrenceId: e.recurrence_id,
                                lockUser: e.lock_user,
                                lockSession: e.lock_session,
                                lockTime: e.lock_time,
                                etag: e._etag,
                            })
                        } else if (eventInStore.lock_session) {
                            updateRecurrences.push({
                                originalEventLocked: e._id,
                                recurrenceId: e.recurrence_id,
                                lockUser: null,
                                lockSession: null,
                                lockTime: null,
                                etag: e._etag,
                            })
                        }

                    }
                } else if (e.lock_user) {
                    updateRecurrences.push({
                        originalEventLocked: e._id,
                        recurrenceId: e.recurrence_id,
                        lockUser: e.lock_user,
                        lockSession: e.lock_session,
                        lockTime: e.lock_time,
                        etag: e._etag,
                    })
                }

            }
        }
    })

    updateRecurrences.forEach((recurrence) => {
        // Update all recurring events of that series: that they are locked/unlocked as well.
        Object.keys(_events).forEach((eKey) => {
            if (_events[eKey].recurrence_id === recurrence.recurrenceId) {
                _events[eKey] = {
                    ..._events[eKey],
                    lock_action: 'edit',
                    lock_user: recurrence.lockUser,
                    lock_time: recurrence.lockTime,
                    lock_session: null, // null to differentiate actual object being locked
                }

                if (eKey === recurrence.originalEventLocked) {
                    _events[eKey].lock_session = recurrence.lockSession
                    _events[eKey]._etag = recurrence.etag
                }
            }
        })
    })

    return _events
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
        const _events = modifyEventsBeingAdded(state, payload)

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
})

export default eventsReducer
