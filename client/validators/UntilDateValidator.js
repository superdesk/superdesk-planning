import {get} from 'lodash';
export const UntilDateValidator = (values) => {
    if (!values.dates) {
        return {};
    }

    const errors = {dates: {recurring_rule: {}}};
    const frequency = get(values, 'dates.recurring_rule.frequency');
    const byday = get(values, 'dates.recurring_rule.byday');
    const endRepeatMode = get(values, 'dates.recurring_rule.endRepeatMode');
    const until = get(values, 'dates.recurring_rule.until');
    const count = get(values, 'dates.recurring_rule.count');

    if (until && values.dates.start > until) {
        errors.dates.recurring_rule.until = 'Must be greater than starting date';
    }

    if (frequency === 'WEEKLY' && !byday) {
        errors.dates.recurring_rule.byday = 'Required';
    }

    if (endRepeatMode === 'until' && !until) {
        errors.dates.recurring_rule.until = 'Required';
    }

    if (endRepeatMode === 'count' && !count) {
        errors.dates.recurring_rule.count = 'Required';
    }

    return errors;
};

export default UntilDateValidator;
