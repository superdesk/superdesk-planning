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
    },
    WORKFLOW_STATE: {
        ASSIGNED: 'assigned',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        SUBMITTED: 'submitted',
        CANCELLED: 'cancelled',
    },
    ITEM_ACTIONS: {
        REASSIGN: {
            label: 'Reassign',
            icon: 'icon-share-alt',
        },
        COMPLETE: {
            label: 'Complete Assignment',
            icon: 'icon-ok',
        },
        EDIT_PRIORITY: {
            label: 'Edit Priority',
            icon: 'icon-chevron-up-thin',
        },
        START_WORKING: {
            label: 'Start Working',
            icon: 'icon-external',
        },
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
}
