import { get } from 'lodash'
export const UntilDateAfterStartDate = (values) => {
    const errors = {}
    const until = get(values, 'dates.recurring_rule.until')
    if (values.dates && until  && values.dates.start > until) {
        errors.dates = { recurring_rule: { until: 'Must be greater than starting date' } }
    }

    return errors
}

export default UntilDateAfterStartDate
