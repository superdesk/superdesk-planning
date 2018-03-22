import {gettext} from '../utils/gettext';

export const PLANNING = {
    ACTIONS: {
        SPIKE_PLANNING: 'SPIKE_PLANNING',
        UNSPIKE_PLANNING: 'UNSPIKE_PLANNING',
        REQUEST_PLANNINGS: 'REQUEST_PLANNINGS',
        RECEIVE_PLANNINGS: 'RECEIVE_PLANNINGS',
        OPEN_PLANNING_EDITOR: 'OPEN_PLANNING_EDITOR',
        PREVIEW_PLANNING: 'PREVIEW_PLANNING',
        CLOSE_PLANNING_EDITOR: 'CLOSE_PLANNING_EDITOR',
        SET_ONLY_FUTURE: 'SET_ONLY_FUTURE',
        SET_ONLY_SPIKED: 'SET_ONLY_SPIKED',
        PLANNING_FILTER_BY_KEYWORD: 'PLANNING_FILTER_BY_KEYWORD',
        PLANNING_FILTER_BY_TIMELINE: 'PLANNING_FILTER_BY_TIMELINE',
        RECEIVE_COVERAGE: 'RECEIVE_COVERAGE',
        COVERAGE_DELETED: 'COVERAGE_DELETED',
        RECEIVE_PLANNING_HISTORY: 'RECEIVE_PLANNING_HISTORY',
        SET_LIST: 'SET_PLANNING_LIST',
        ADD_TO_LIST: 'ADD_TO_PLANNING_LIST',
        CLEAR_LIST: 'CLEAR_PLANNING_LIST',
        OPEN_ADVANCED_SEARCH: 'PLANNING_OPEN_ADVANCED_SEARCH',
        CLOSE_ADVANCED_SEARCH: 'PLANNING_CLOSE_ADVANCED_SEARCH',
        SET_ADVANCED_SEARCH: 'SET_ADVANCED_SEARCH',
        CLEAR_ADVANCED_SEARCH: 'CLEAR_ADVANCED_SEARCH',
        MARK_PLANNING_CANCELLED: 'MARK_PLANNING_CANCELLED',
        MARK_COVERAGE_CANCELLED: 'MARK_COVERAGE_CANCELLED',
        MARK_PLANNING_POSTPONED: 'MARK_PLANNING_POSTPONED',
        TOGGLE_SELECTED: 'TOGGLE_SELECTED',
        SELECT_ALL: 'SELECT_ALL',
        DESELECT_ALL: 'DESELECT_ALL',
        LOCK_PLANNING: 'LOCK_PLANNING',
        UNLOCK_PLANNING: 'UNLOCK_PLANNING',
        ADD_COVERAGE_FROM_NEWS_ITEM: 'ADD_COVERAGE_FROM_NEWS_ITEM',
    },
    // Number of ids to look for by single request
    // because url length must stay short
    // chunk size must be lower than page limit (25)
    FETCH_IDS_CHUNK_SIZE: 25,
    PLANNING_FILTER_TIMELINE: {
        FUTURE: 'FUTURE',
        PAST: 'PAST',
        NOT_SCHEDULED: 'NOT_SCHEDULED',
    },
    ITEM_ACTIONS: {
        SPIKE: {
            label: gettext('Spike'),
            icon: 'icon-trash',
            actionName: 'onSpikePlanning'
        },
        UNSPIKE: {
            label: gettext('Unspike'),
            icon: 'icon-unspike',
            actionName: 'onUnspikePlanning'
        },
        DUPLICATE: {
            label: gettext('Duplicate'),
            icon: 'icon-copy',
            actionName: 'onDuplicatePlanning',
        },
        CANCEL_PLANNING: {
            label: gettext('Cancel planning'),
            icon: 'icon-close-small',
            actionName: 'onCancelPlanning',
            lock_action: 'planning_cancel',
        },
        CANCEL_ALL_COVERAGE: {
            label: gettext('Cancel all coverage'),
            icon: 'icon-close-small',
            actionName: 'onCancelAllCoverage',
            lock_action: 'cancel_all_coverage',
        },
        ADD_TO_PLANNING: {lock_action: 'add_to_planning'},
        ADD_AS_EVENT: {
            label: gettext('Add As Event'),
            icon: 'icon-calendar',
            actionName: 'onAddAsEvent',
        }
    },
    NEWS_COVERAGE_CANCELLED_STATUS: {
        qcode: 'ncostat:notint',
        name: 'coverage not intended',
        label: 'Not planned',
    },
    G2_CONTENT_TYPE: {
        TEXT: 'text',
        VIDEO: 'video',
        LIVE_VIDEO: 'live_video',
        AUDIO: 'audio',
        PICTURE: 'picture',
    },
    DEFAULT_VALUE: {type: 'planning'}
};
