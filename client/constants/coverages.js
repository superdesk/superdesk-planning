import {get} from 'lodash';
import moment from 'moment';
import {WORKFLOW_STATE} from './index';

export const COVERAGES = {
    DEFAULT_VALUE: (newsCoverageStatus, planningItem, g2contentType) => ({
        planning: {
            slugline: get(planningItem, 'slugline'),
            internal_note: get(planningItem, 'internal_note'),
            ednote: get(planningItem, 'ednote'),
            scheduled: get(planningItem, 'planning_date', moment()),
            g2_content_type: g2contentType,
        },
        news_coverage_status: newsCoverageStatus[0],
        workflow_status: WORKFLOW_STATE.DRAFT,
    }),
    WORKFLOW_STATE: {ACTIVE: 'active'},
    PARTIAL_SAVE: {
        ADD_TO_WORKFLOW: 'ADD_TO_WORKFLOW',
        REMOVE_ASSIGNMENT: 'REMOVE_ASSIGNMENT',
    },
};
