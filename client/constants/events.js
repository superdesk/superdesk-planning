export const EVENTS = {
    ACTIONS: {
        SPIKE_EVENT: 'SPIKE_EVENT',
        UNSPIKE_EVENT: 'UNSPIKE_EVENT',
        REQUEST_EVENTS: 'REQUEST_EVENTS',
        SET_EVENTS_LIST: 'SET_EVENTS_LIST',
        ADD_TO_EVENTS_LIST: 'ADD_TO_EVENTS_LIST',
        OPEN_ADVANCED_SEARCH: 'OPEN_ADVANCED_SEARCH',
        CLOSE_ADVANCED_SEARCH: 'CLOSE_ADVANCED_SEARCH',
        PREVIEW_EVENT: 'PREVIEW_EVENT',
        OPEN_EVENT_DETAILS: 'OPEN_EVENT_DETAILS',
        CLOSE_EVENT_DETAILS: 'CLOSE_EVENT_DETAILS',
        ADD_EVENTS: 'ADD_EVENTS',
        TOGGLE_EVENT_LIST: 'TOGGLE_EVENT_LIST',
    },
    // Number of ids to look for by single request
    // because url length must stay short
    // chunk size must be lower than page limit (25)
    FETCH_IDS_CHUNK_SIZE: 25,
}
