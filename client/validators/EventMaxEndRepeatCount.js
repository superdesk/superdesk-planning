/**
 * Check the `recurring_rule.endRepeatMode` is `count`, and that `count`
 * does not exceed the server config for the maximum number of events in
 * a series of recurrent events
 * @param {object} values - Form values
 * @param {object} props - Component props
 * @return {object} Error message if not valid, otherwise {}
 * @constructor
 */
export const EventMaxEndRepeatCount = (values, props) => {
    const errors = {};

    if (values.dates &&
        values.dates.recurring_rule &&
        values.dates.recurring_rule.endRepeatMode === 'count'
    ) {
        let count = parseInt(values.dates.recurring_rule.count);

        if (count > props.maxRecurrentEvents) {
            const errorMessage = `Must be less than ${props.maxRecurrentEvents + 1}`;

            errors.dates = {recurring_rule: {count: errorMessage}};
        } else if (count < 2) {
            errors.dates = {recurring_rule: {count: 'Must be greater than 1'}};
        }
    }

    return errors;
};

export default EventMaxEndRepeatCount;
