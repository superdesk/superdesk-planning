import {get} from 'lodash';
import moment from 'moment';

export const COVERAGES = {
    DEFAULT_VALUE: (newsCoverageStatus, planningItem) => ({
        planning: {
            slugline: get(planningItem, 'slugline'),
            internal_note: get(planningItem, 'internal_note'),
            ednote: get(planningItem, 'ednote'),
            scheduled: get(planningItem, 'planning_date', moment())
        },
        news_coverage_status: newsCoverageStatus[0]
    })
};
