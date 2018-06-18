import {gettext} from '../utils/gettext';

export const PLANNING = {
    ACTIONS: {
        SPIKE_PLANNING: 'SPIKE_PLANNING',
        UNSPIKE_PLANNING: 'UNSPIKE_PLANNING',
        RECEIVE_PLANNINGS: 'RECEIVE_PLANNINGS',
        RECEIVE_PLANNING_HISTORY: 'RECEIVE_PLANNING_HISTORY',
        SET_LIST: 'SET_PLANNING_LIST',
        ADD_TO_LIST: 'ADD_TO_PLANNING_LIST',
        CLEAR_LIST: 'CLEAR_PLANNING_LIST',
        MARK_PLANNING_CANCELLED: 'MARK_PLANNING_CANCELLED',
        MARK_COVERAGE_CANCELLED: 'MARK_COVERAGE_CANCELLED',
        MARK_PLANNING_POSTPONED: 'MARK_PLANNING_POSTPONED',
        LOCK_PLANNING: 'LOCK_PLANNING',
        UNLOCK_PLANNING: 'UNLOCK_PLANNING',
        EXPIRE_PLANNING: 'EXPIRE_PLANNING',
    },
    // Number of ids to look for by single request
    // because url length must stay short
    // chunk size must be lower than page limit (25)
    FETCH_IDS_CHUNK_SIZE: 25,
    ITEM_ACTIONS: {
        SPIKE: {
            label: gettext('Spike planning'),
            icon: 'icon-trash',
            actionName: 'onSpikePlanning',
        },
        UNSPIKE: {
            label: gettext('Unspike planning'),
            icon: 'icon-unspike',
            actionName: 'onUnspikePlanning',
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
        },
        EDIT_PLANNING: {
            label: gettext('Edit'),
            icon: 'icon-pencil',
            actionName: 'onEditPlanning',
            lock_action: 'edit',
        },
        EDIT_PLANNING_MODAL: {
            label: gettext('Edit in popup'),
            icon: 'icon-external',
            actionName: 'onEditPlanningModal',
            lock_action: 'edit',
        },
        ASSIGN_TO_AGENDA: {
            label: gettext('Assign to agenda'),
            icon: 'icon-list-plus',
            actionName: 'onAssignToAgenda',
        },
        ADD_COVERAGE: {
            label: gettext('Add coverage'),
            icon: 'icon-plus-small',
            actionName: 'onAddCoverage',
        },
    },
    NEWS_COVERAGE_CANCELLED_STATUS: {
        qcode: 'ncostat:notint',
        name: 'coverage not intended',
        label: 'Not planned',
    },
    G2_CONTENT_TYPE: {
        TEXT: gettext('text'),
        VIDEO: gettext('video'),
        LIVE_VIDEO: gettext('live_video'),
        AUDIO: gettext('audio'),
        PICTURE: gettext('picture'),
    },
    HISTORY_OPERATIONS: {
        ASSIGN_AGENDA: 'assign_agenda',
        PLANNING_CANCEL: 'planning_cancel',
    },
};
