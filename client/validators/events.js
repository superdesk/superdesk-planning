import moment from 'moment';
import {get} from 'lodash';
import {gettext} from '../utils';

const endAfterStart = (startDate, endDate) => {
    let errors = {
        hasErrors: false,
        data: {},
    };

    if (moment.isMoment(startDate) && moment.isMoment(endDate) &&
        endDate.isBefore(startDate)) {
        errors.hasErrors = true;
        errors.data.end = gettext('End date should be after start date');
    }

    return errors;
};

const recurringRuleValidation = (dates, maxRecurrentEvents) => {
    const frequency = get(dates, 'recurring_rule.frequency');
    const byday = get(dates, 'recurring_rule.byday');
    const endRepeatMode = get(dates, 'recurring_rule.endRepeatMode');
    const until = get(dates, 'recurring_rule.until');
    const count = get(dates, 'recurring_rule.count');

    let errors = {
        hasErrors: false,
        data: {},
    };

    if (until && dates.start > until) {
        errors.hasErrors = true;
        errors.data.until = gettext('Must be greater than starting date');
    }

    if (frequency === 'WEEKLY' && !byday) {
        errors.hasErrors = true;
        errors.data.byday = gettext('Required');
    }

    if (endRepeatMode === 'until' && !until) {
        errors.hasErrors = true;
        errors.data.until = gettext('Required');
    }

    if (endRepeatMode === 'count') {
        if (!count) {
            errors.hasErrors = true;
            errors.data.count = gettext('Required');
        } else {
            let count = parseInt(dates.recurring_rule.count, 10);

            if (count > maxRecurrentEvents) {
                errors.hasErrors = true;
                errors.data.count = gettext('Must be less than ') + (maxRecurrentEvents + 1);
            } else if (count < 2) {
                errors.hasErrors = true;
                errors.data.count = gettext('Must be greater than 1');
            }
        }
    }

    return errors;
};

const validateEventDates = (dates, maxRecurrentEvents) => {
    let errors = {
        hasErrors: false,
        data: {},
    };
    const datesErrors = self.endAfterStart(dates.start, dates.end);
    const recurringErrors = self.recurringRuleValidation(dates, maxRecurrentEvents);

    if (datesErrors.hasErrors || recurringErrors.hasErrors) {
        errors.hasErrors = true;
        errors.data.dates = datesErrors.data;
        errors.data.dates.recurring_rule = recurringErrors.data;
    }

    return errors;
};

// eslint-disable-next-line consistent-this
const self = {
    endAfterStart,
    recurringRuleValidation,
    validateEventDates,

};

export default self;
