import {superdeskApi} from '../superdeskApi';

export const COVERAGES = {
    WORKFLOW_STATE: {ACTIVE: 'active'},
    PARTIAL_SAVE: {
        ADD_TO_WORKFLOW: 'ADD_TO_WORKFLOW',
        REMOVE_ASSIGNMENT: 'REMOVE_ASSIGNMENT',
        CANCEL_COVERAGE: 'CANCEL_COVERAGE',
        SCHEDULED_UPDATES_ADD_TO_WORKFLOW: 'SCHEDULED_UPDATES_ADD_TO_WORKFLOW',
        SCHEDULED_UPDATES_REMOVE_ASSIGNMENT: 'SCHEDULED_UPDATES_REMOVE_ASSIGNMENT',
    },
    HISTORY_OPERATIONS: {
        CREATED: 'coverage_created',
        DELETED: 'coverage_deleted',
        EDITED: 'coverage_edited',
        CANCELLED: 'coverage_cancelled',
        PLANNING_CANCELLED: 'planning_cancelled',
        CREATED_CONTENT: 'coverage_created_content',
        ASSIGNED: 'coverage_assigned',
    },
    DEFAULT_DESK_PREFERENCE: 'planning:default_coverage_desks',
    ADD_ADVANCED_MODE_PREFERENCE: 'planning:add_coverage_advanced_mode',
    ITEM_ACTIONS: {
        CANCEL_COVERAGE: {
            label: 'Cancel coverage',
            icon: 'icon-close-small',
            actionName: 'onCancelCoverage',
        },
    },
};

export function assignCoverageConstantTranslations() {
    const {gettext} = superdeskApi.localization;

    COVERAGES.ITEM_ACTIONS.CANCEL_COVERAGE.label = gettext('Cancel coverage');
}
