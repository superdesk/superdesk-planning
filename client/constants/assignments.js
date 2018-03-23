import {gettext} from '../utils/gettext';

export const ASSIGNMENTS = {
    ACTIONS: {
        RECEIVED_ASSIGNMENTS: 'RECEIVED_ASSIGNMENTS',
        RECEIVED_MORE_ASSIGNMENTS: 'RECEIVED_MORE_ASSIGNMENTS',
        CHANGE_LIST_SETTINGS: 'CHANGE_LIST_SETTINGS',
        SELECT_ASSIGNMENTS: 'SELECT_ASSIGNMENTS',
        DESELECT_ASSIGNMENT: 'DESELECT_ASSIGNMENT',
        PREVIEW_ASSIGNMENT: 'PREVIEW_ASSIGNMENT',
        CLOSE_PREVIEW_ASSIGNMENT: 'CLOSE_PREVIEW_ASSIGNMENT',
        SET_ASSIGNMENTS_LIST: 'SET_ASSIGNMENTS_LIST',
        SET_TODO_LIST: 'SET_TODO_LIST',
        SET_IN_PROGRESS_LIST: 'SET_IN_PROGRESS_LIST',
        SET_COMPLETED_LIST: 'SET_COMPLETED_LIST',
        ADD_TO_TODO_LIST: 'ADD_TO_TODO_LIST',
        ADD_TO_IN_PROGRESS_LIST: 'ADD_TO_IN_PROGRESS_LIST',
        ADD_TO_COMPLETED_LIST: 'ADD_TO_COMPLETED_LIST',
        ADD_TO_ASSIGNMENTS_LIST: 'ADD_TO_ASSIGNMENTS_LIST',
        DESK_CHANGE: 'DESK_CHANGE',
        OPEN_ASSIGNMENT_EDITOR: 'OPEN_ASSIGNMENT_EDITOR',
        CLOSE_ASSIGNMENT_EDITOR: 'CLOSE_ASSIGNMENT_EDITOR',
        LOCK_ASSIGNMENT: 'LOCK_ASSIGNMENT',
        UNLOCK_ASSIGNMENT: 'UNLOCK_ASSIGNMENT',
        CHANGE_LIST_VIEW_MODE: 'CHANGE_LIST_VIEW_MODE',
        RECEIVED_ARCHIVE: 'RECEIVED_ARCHIVE',
        REMOVE_ASSIGNMENT: 'REMOVE_ASSIGNMENT',
        RECEIVE_ASSIGNMENT_HISTORY: 'RECEIVE_ASSIGNMENT_HISTORY',
    },
    WORKFLOW_STATE: {
        ASSIGNED: 'assigned',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        SUBMITTED: 'submitted',
        CANCELLED: 'cancelled',
        REVERTED: 'reverted',
    },
    ITEM_ACTIONS: {
        REASSIGN: {
            label: gettext('Reassign'),
            icon: 'icon-share-alt',
        },
        COMPLETE: {
            label: gettext('Complete Assignment'),
            icon: 'icon-ok',
        },
        EDIT_PRIORITY: {
            label: gettext('Edit Priority'),
            icon: 'icon-chevron-up-thin',
        },
        START_WORKING: {
            label: gettext('Start Working'),
            icon: 'icon-external',
        },
        REMOVE: {
            label: gettext('Remove Assignment'),
            icon: 'icon-trash',
        },
        PREVIEW_ARCHIVE: {
            label: gettext('Open Coverage'),
            icon: 'icon-external',
        },
        CONFIRM_AVAILABILITY: {
            label: gettext('Confirm Availability'),
            icon: 'icon-ok',
        },
        REVERT_AVAILABILITY: {
            label: gettext('Revert Availability'),
            icon: 'icon-revert',
        }
    },
    DEFAULT_PRIORITY: 2,
    LIST_GROUPS: {
        TODO: {
            label: 'To Do',
            states: ['assigned', 'submitted'],
        },
        IN_PROGRESS: {
            label: 'In Progress',
            states: ['in_progress'],
        },
        COMPLETED: {
            label: 'Completed',
            states: ['completed', 'cancelled'],
        },
    },
};
