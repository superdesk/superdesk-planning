import {get} from 'lodash';
import moment from 'moment';
import {WORKFLOW_STATE} from './index';

export const COVERAGES = {
    DEFAULT_VALUE: (newsCoverageStatus, planningItem) => ({
        planning: {
            slugline: get(planningItem, 'slugline'),
            internal_note: get(planningItem, 'internal_note'),
            ednote: get(planningItem, 'ednote'),
            scheduled: get(planningItem, 'planning_date', moment())
        },
        news_coverage_status: newsCoverageStatus[0],
        workflow_status: WORKFLOW_STATE.DRAFT,
    }),
    WORKFLOW_STATE: {ACTIVE: 'active'},
};
