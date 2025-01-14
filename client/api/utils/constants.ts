import {flatMap} from 'lodash';

export const SYSTEM_REQUIRED_FIELDS = [
    ['planning_date'],
    ['slugline', 'headline', 'name'],
    ['coverages'],
];

export const isSystemRequiredField = (() => {
    const SYSTEM_REQUIRED_FIELDS_SET = new Set(flatMap(SYSTEM_REQUIRED_FIELDS));

    return (fieldId: string) => SYSTEM_REQUIRED_FIELDS_SET.has(fieldId);
})();
