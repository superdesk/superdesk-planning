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
        ADD_TO_ASSIGNMENTS_LIST: 'ADD_TO_ASSIGNMENTS_LIST',
        DESK_CHANGE: 'DESK_CHANGE',
        OPEN_ASSIGNMENT_EDITOR: 'OPEN_ASSIGNMENT_EDITOR',
        CLOSE_ASSIGNMENT_EDITOR: 'CLOSE_ASSIGNMENT_EDITOR',
        LOCK_ASSIGNMENT: 'LOCK_ASSIGNMENT',
        UNLOCK_ASSIGNMENT: 'UNLOCK_ASSIGNMENT',
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
            icon: 'con-chevron-up-thin',
        },
    },
    DEFAULT_PRIORITY: 2,
}
