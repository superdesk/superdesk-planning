import {get} from 'lodash';

export const COVERAGES = {
    DEFAULT_VALUE: (newsCoverageStatus, planningItem) => ({
        planning: {slugline: get(planningItem, 'slugline')},
        news_coverage_status: newsCoverageStatus[0]
    })
};
