export const EVENTS = {
    ACTIONS: {
        SPIKE_EVENT: 'SPIKE_EVENT',
        UNSPIKE_EVENT: 'UNSPIKE_EVENT',
        REQUEST_EVENTS: 'REQUEST_EVENTS',
        SET_EVENTS_LIST: 'SET_EVENTS_LIST',
        ADD_TO_EVENTS_LIST: 'ADD_TO_EVENTS_LIST',
        OPEN_ADVANCED_SEARCH: 'EVENT_OPEN_ADVANCED_SEARCH',
        CLOSE_ADVANCED_SEARCH: 'EVENT_CLOSE_ADVANCED_SEARCH',
        PREVIEW_EVENT: 'PREVIEW_EVENT',
        OPEN_EVENT_DETAILS: 'OPEN_EVENT_DETAILS',
        CLOSE_EVENT_DETAILS: 'CLOSE_EVENT_DETAILS',
        ADD_EVENTS: 'ADD_EVENTS',
        RECEIVE_EVENT_HISTORY: 'RECEIVE_EVENT_HISTORY',
        TOGGLE_EVENT_LIST: 'TOGGLE_EVENT_LIST',
        SELECT_EVENTS: 'SELECT_EVENTS',
        DESELECT_EVENT: 'DESELECT_EVENT',
        DESELECT_ALL_EVENT: 'DESELECT_ALL_EVENT',
        MARK_EVENT_CANCELLED: 'MARK_EVENT_CANCELLED',
        MARK_EVENT_HAS_PLANNINGS: 'MARK_EVENT_HAS_PLANNINGS',
    },
    // Number of ids to look for by single request
    // because url length must stay short
    // chunk size must be lower than page limit (25)
    FETCH_IDS_CHUNK_SIZE: 25,
    ITEM_ACTIONS: {
        CREATE_PLANNING: {
            label: 'Create Planning Item',
            icon: 'icon-new-doc',
        },
        CANCEL_EVENT: {
            label: 'Cancel',
            icon: 'icon-close-small',
        },
        UPDATE_TIME: {
            label: 'Update time',
            icon: 'icon-time',
        },
        RESCHEDULE_EVENT: {
            label: 'Reschedule',
            icon: 'icon-calendar',
        },
        CONVERT_TO_RECURRING: {
            label: 'Convert to recurring event',
            icon: 'icon-repeat',
        },
    },
}
