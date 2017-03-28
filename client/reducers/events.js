import { orderBy, cloneDeep, uniq } from 'lodash'

const initialState = {
    events: {},
    eventsInList: [],
    search: {
        currentSearch: undefined,
        advancedSearchOpened: false,
    },
    show: true,
    showEventDetails: null,
}

const eventsReducer = (state=initialState, action) => {
    switch (action.type) {
        case 'TOGGLE_EVENT_LIST':
            return {
                ...state,
                show: !state.show,
            }
        case 'REQUEST_EVENTS':
            return {
                ...state,
                search: {
                    ...state.search,
                    currentSearch: action.payload,
                },
            }
        case 'ADD_EVENTS':
            var _events = cloneDeep(state.events)
            action.payload.forEach((e) => (
                _events[e._id] = e
            ))
            return {
                ...state,
                events: _events,
            }
        case 'SET_EVENTS_LIST':
            return {
                ...state,
                eventsInList: orderBy(action.payload, (e) => (
                    state.events[e].dates.start
                ), ['desc']),
            }
        case 'ADD_TO_EVENTS_LIST':
            return eventsReducer(state, {
                type: 'SET_EVENTS_LIST',
                payload: uniq([...state.eventsInList, ...action.payload]),
            })
        case 'OPEN_ADVANCED_SEARCH':
            return {
                ...state,
                search: {
                    ...state.search,
                    advancedSearchOpened: true,
                },
            }
        case 'CLOSE_ADVANCED_SEARCH':
            return {
                ...state,
                search: {
                    ...state.search,
                    advancedSearchOpened: false,
                },
            }
        case 'OPEN_EVENT_DETAILS':
            return {
                ...state,
                showEventDetails: action.payload,
            }
        case 'CLOSE_EVENT_DETAILS':
            return {
                ...state,
                showEventDetails: null,
            }
        default:
            return state
    }
}

export default eventsReducer
