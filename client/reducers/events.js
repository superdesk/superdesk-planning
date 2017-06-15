import { orderBy, cloneDeep, uniq, get } from 'lodash'
import moment from 'moment'
import { EVENTS } from '../constants'

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
    selectedEvent: null,
    readOnly: true,
}

/*eslint-disable complexity*/
const eventsReducer = (state=initialState, action) => {
    switch (action.type) {
        case EVENTS.ACTIONS.TOGGLE_EVENT_LIST:
            return {
                ...state,
                show: !state.show,
            }
        case EVENTS.ACTIONS.REQUEST_EVENTS:
            return {
                ...state,
                lastRequestParams: {
                    ...initialLastRequest,
                    ...action.payload,
                },
                search: {
                    ...state.search,
                    currentSearch: action.payload,
                },
            }
        case EVENTS.ACTIONS.ADD_EVENTS:
            var _events = cloneDeep(state.events)
            action.payload.forEach((e) => {
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
        case EVENTS.ACTIONS.SET_EVENTS_LIST:
            return {
                ...state,
                eventsInList: orderBy(action.payload, (e) => (
                    state.events[e].dates.start
                ), ['desc']),
            }
        case EVENTS.ACTIONS.ADD_TO_EVENTS_LIST:
            return eventsReducer(state, {
                type: EVENTS.ACTIONS.SET_EVENTS_LIST,
                payload: uniq([...state.eventsInList, ...action.payload]),
            })
        case EVENTS.ACTIONS.OPEN_ADVANCED_SEARCH:
            return {
                ...state,
                search: {
                    ...state.search,
                    advancedSearchOpened: true,
                },
            }
        case EVENTS.ACTIONS.CLOSE_ADVANCED_SEARCH:
            return {
                ...state,
                search: {
                    ...state.search,
                    advancedSearchOpened: false,
                },
            }
        case EVENTS.ACTIONS.PREVIEW_EVENT:
            return {
                ...state,
                showEventDetails: action.payload,
                selectedEvent: action.payload,
            }

        case EVENTS.ACTIONS.OPEN_EVENT_DETAILS:
            return {
                ...state,
                showEventDetails: action.payload,
                selectedEvent: action.payload,
                readOnly: false,
            }
        case EVENTS.ACTIONS.CLOSE_EVENT_DETAILS:
            return {
                ...state,
                showEventDetails: null,
                readOnly: true,
            }
        default:
            return state
    }
}
/*eslint-enable*/

export default eventsReducer
