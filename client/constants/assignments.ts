import {superdeskApi} from '../superdeskApi';

export const ASSIGNMENTS = {
    ACTIONS: {
        RECEIVED_ASSIGNMENTS: 'RECEIVED_ASSIGNMENTS',
        CHANGE_LIST_SETTINGS: 'CHANGE_LIST_SETTINGS',
        PREVIEW_ASSIGNMENT: 'PREVIEW_ASSIGNMENT',
        CLOSE_PREVIEW_ASSIGNMENT: 'CLOSE_PREVIEW_ASSIGNMENT',
        SET_TODO_LIST: 'SET_TODO_LIST',
        MY_ASSIGNMENTS_TOTAL: 'MY_ASSIGNMENTS_TOTAL',
        SET_IN_PROGRESS_LIST: 'SET_IN_PROGRESS_LIST',
        SET_COMPLETED_LIST: 'SET_COMPLETED_LIST',
        ADD_TO_TODO_LIST: 'ADD_TO_TODO_LIST',
        ADD_TO_IN_PROGRESS_LIST: 'ADD_TO_IN_PROGRESS_LIST',
        ADD_TO_COMPLETED_LIST: 'ADD_TO_COMPLETED_LIST',
        LOCK_ASSIGNMENT: 'LOCK_ASSIGNMENT',
        UNLOCK_ASSIGNMENT: 'UNLOCK_ASSIGNMENT',
        CHANGE_LIST_VIEW_MODE: 'CHANGE_LIST_VIEW_MODE',
        RECEIVED_ARCHIVE: 'RECEIVED_ARCHIVE',
        REMOVE_ASSIGNMENT: 'REMOVE_ASSIGNMENT',
        RECEIVE_ASSIGNMENT_HISTORY: 'RECEIVE_ASSIGNMENT_HISTORY',
        SET_BASE_QUERY: 'SET_BASE_ASSIGNMENT_QUERY',

        SET_LIST_PAGE: 'SET_ASSIGNMENT_LIST_PAGE',
        SET_LIST_ITEMS: 'SET_ASSIGNMENT_LIST_ITEMS',
        ADD_LIST_ITEMS: 'ADD_ASSIGNMENT_LIST_ITEMS',
        SET_GROUP_KEYS: 'SET_ASSIGNMENT_GROUP_KEYS',
        SET_GROUP_SORT_ORDER: 'SET_ASSIGNMENT_GROUP_SORT_ORDER',
        SET_SORT_FIELD: 'SET_ASSIGNMENT_SORT_FIELD',
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
        START_WORKING: {
            label: 'Start Working',
            icon: 'icon-external',
            actionName: 'onStartWorkingOnAssignment',
        },
        REASSIGN: {
            label: 'Reassign',
            icon: 'icon-share-alt',
            actionName: 'onReassignAssignment',
        },
        COMPLETE: {
            label: 'Complete Assignment',
            icon: 'icon-ok',
            actionName: 'onCompleteAssignment',
        },
        EDIT_PRIORITY: {
            label: 'Edit Priority',
            icon: 'icon-chevron-up-thin',
            actionName: 'onEditAssignmentPriority',
        },
        REMOVE: {
            label: 'Remove Assignment',
            icon: 'icon-trash',
            lock_action: 'remove_assignment',
            actionName: 'onRemoveAssignment',
        },
        PREVIEW_ARCHIVE: {
            label: 'Open Coverage',
            icon: 'icon-external',
            actionName: 'onOpenAssignmentCoverage',
        },
        CONFIRM_AVAILABILITY: {
            label: 'Confirm Availability',
            icon: 'icon-ok',
            actionName: 'onConfirmAssignmentAvailability',
        },
        REVERT_AVAILABILITY: {
            label: 'Revert Availability',
            icon: 'icon-revert',
            actionName: 'onRevertAssignmentAvailability',
        },
    },
    DEFAULT_PRIORITY: 2,
    LIST_GROUPS: {
        TODO: {
            id: 'TODO',
            label: 'To Do',
            states: ['assigned', 'submitted'],
            emptyMessage: 'There are no assignments to do',
        },
        IN_PROGRESS: {
            id: 'IN_PROGRESS',
            label: 'In Progress',
            states: ['in_progress'],
            emptyMessage: 'There are no assignments in progress',
        },
        COMPLETED: {
            id: 'COMPLETED',
            label: 'Completed',
            states: ['completed', 'cancelled'],
            emptyMessage: 'There are no assignments completed',
        },
        CURRENT: {
            id: 'CURRENT',
            label: 'Current Assignments',
            states: ['assigned', 'submitted'],
            emptyMessage: 'There are no current assignments',
            dateFilter: 'current',
        },
        TODAY: {
            id: 'TODAY',
            label: 'Todays Assignments',
            states: ['assigned', 'submitted'],
            emptyMessage: 'There are no assignments for today',
            dateFilter: 'today',
        },
        FUTURE: {
            id: 'FUTURE',
            label: 'Future Assignments',
            states: ['assigned', 'submitted'],
            emptyMessage: 'There are no future assignments',
            dateFilter: 'future',
        },
    },
    DEFAULT_LIST_GROUPS: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
    HISTORY_OPERATIONS: {
        CREATE: 'create',
        ADD_TO_WORKFLOW: 'add_to_workflow',
        EDIT_PRIORITY: 'edit_priority',
        REASSIGNED: 'reassigned',
        CONTENT_LINK: 'content_link',
        COMPLETE: 'complete',
        CONFIRM: 'confirm',
        REVERT: 'revert',
        SUBMITTED: 'submitted',
        CANCELLED: 'cancelled',
        SPIKE_UNLINK: 'spike_unlink',
        UNLINK: 'unlink',
        START_WORKING: 'start_working',
        ASSIGNMENT_REMOVED: 'assignment_removed',
        ASSIGNMENT_ACCEPTED: 'accepted',
    },
    DEFAULT_SORT_PREFERENCE: 'assignments:default_sort',
};

export function assignAssignmentConstantTranslations() {
    const {gettext} = superdeskApi.localization;

    ASSIGNMENTS.ITEM_ACTIONS.START_WORKING.label = gettext('Start Working');
    ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label = gettext('Reassign');
    ASSIGNMENTS.ITEM_ACTIONS.COMPLETE.label = gettext('Complete Assignment');
    ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label = gettext('Edit Priority');
    ASSIGNMENTS.ITEM_ACTIONS.REMOVE.label = gettext('Remove Assignment');
    ASSIGNMENTS.ITEM_ACTIONS.PREVIEW_ARCHIVE.label = gettext('Open Coverage');
    ASSIGNMENTS.ITEM_ACTIONS.CONFIRM_AVAILABILITY.label = gettext('Confirm Availability');
    ASSIGNMENTS.ITEM_ACTIONS.REVERT_AVAILABILITY.label = gettext('Revert Availability');

    ASSIGNMENTS.LIST_GROUPS.TODO.label = gettext('To Do');
    ASSIGNMENTS.LIST_GROUPS.TODO.emptyMessage = gettext('There are no assignments to do');

    ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label = gettext('In Progress');
    ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.emptyMessage = gettext('There are no assignments in progress');

    ASSIGNMENTS.LIST_GROUPS.COMPLETED.label = gettext('Completed');
    ASSIGNMENTS.LIST_GROUPS.COMPLETED.emptyMessage = gettext('There are no assignments completed');

    ASSIGNMENTS.LIST_GROUPS.CURRENT.label = gettext('Current Assignments');
    ASSIGNMENTS.LIST_GROUPS.CURRENT.emptyMessage = gettext('There are no current assignments');

    ASSIGNMENTS.LIST_GROUPS.TODAY.label = gettext('Todays Assignments');
    ASSIGNMENTS.LIST_GROUPS.TODAY.emptyMessage = gettext('There are no assignments for today');

    ASSIGNMENTS.LIST_GROUPS.FUTURE.label = gettext('Future Assignments');
    ASSIGNMENTS.LIST_GROUPS.FUTURE.emptyMessage = gettext('There are no future assignments');
}
