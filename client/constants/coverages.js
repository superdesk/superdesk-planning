import {get} from 'lodash';

export const COVERAGES = {
    DEFAULT_VALUE: (newsCoverageStatus, planningItem) => ({
        planning: {
            slugline: get(planningItem, 'slugline'),
            internal_note: get(planningItem, 'internal_note'),
            ednote: get(planningItem, 'ednote'),
        },
        news_coverage_status: newsCoverageStatus[0]
    })
};
