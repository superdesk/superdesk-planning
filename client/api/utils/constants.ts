import {flatMap} from 'lodash';

export const COVERAGE_SYSTEM_REQUIRED_FIELDS = [
    ['g2_content_type'],
    ['scheduled'],
    ['add_coverage_to_workflow']
];

export const PLANNING_ITEM_SYSTEM_REQUIRED_FIELDS = [
    ['planning_date'],
    ['slugline', 'headline', 'name'],
    ['coverages'],
];

export const isSystemRequiredField = (() => {
    const SYSTEM_REQUIRED_FIELDS_SET = new Set(flatMap(PLANNING_ITEM_SYSTEM_REQUIRED_FIELDS));

    return (fieldId: string) => SYSTEM_REQUIRED_FIELDS_SET.has(fieldId);
})();
