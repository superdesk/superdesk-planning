import moment from 'moment';
import {get, set, isEmpty, isEqual} from 'lodash';
import {gettext, eventUtils} from '../utils';
import * as selectors from '../selectors';
import {formProfile} from './profile';

const validateRequiredDates = (dates, errors, messages) => {
    if (!get(dates, 'start')) {
        set(errors, 'start.date', gettext('This field is required'));
        set(errors, 'start.time', gettext('This field is required'));
        messages.push(gettext('START DATE/TIME are required fields'));
    }

    if (!get(dates, 'end')) {
        set(errors, 'end.date', gettext('This field is required'));
        set(errors, 'end.time', gettext('This field is required'));
        messages.push(gettext('END DATE/TIME are required fields'));
    }
};

const validateDateRange = (dates, errors, messages) => {
    const startDate = get(dates, 'start');
    const endDate = get(dates, 'end');

    if (moment.isMoment(startDate) &&
        moment.isMoment(endDate) &&
        endDate.isSameOrBefore(startDate)
    ) {
        if (eventUtils.isEventSameDay(startDate, endDate)) {
            set(errors, 'end.time', gettext('End time should be after start time'));
            messages.push(gettext('END TIME should be after START TIME'));
        } else {
            set(errors, 'end.date', gettext('End date should be after start date'));
            messages.push(gettext('END DATE should be after START DATE'));
        }
    }
};

const validateRecurringRules = (getState, dates, errors, messages) => {
    const maxRecurringEvents = selectors.config.getMaxRecurrentEvents(getState());
    const frequency = get(dates, 'recurring_rule.frequency');
    const byday = get(dates, 'recurring_rule.byday');
    const endRepeatMode = get(dates, 'recurring_rule.endRepeatMode');
    const until = get(dates, 'recurring_rule.until');
    let count = get(dates, 'recurring_rule.count');
    const startDate = get(dates, 'start');

    let recurringErrors = {};

    if (until && startDate > until) {
        recurringErrors.until = gettext('Must be greater than starting date');
        messages.push(gettext('RECURRING ENDS ON must be greater than START DATE'));
    }

    if (frequency === 'WEEKLY' && !byday) {
        recurringErrors.byday = gettext('Required');
        messages.push(gettext('RECURRING REPEAT ON is a required field'));
    }

    if (endRepeatMode === 'until' && !until) {
        recurringErrors.until = gettext('Required');
        messages.push(gettext('RECURRING REPEAT UNTIL is a required field'));
    }

    if (endRepeatMode === 'count') {
        if (!count) {
            recurringErrors.count = gettext('Required');
            messages.push(gettext('RECURRING REPEAT COUNT is a required field'));
        } else {
            count = parseInt(count, 10);

            if (count > maxRecurringEvents) {
                const maximum = maxRecurringEvents + 1;

                recurringErrors.count = gettext('Must be less than {{ maximum }}', {maximum});
                messages.push(gettext('RECURRING REPEAT COUNT must be less than {{ maximum }}', {maximum}));
            } else if (count < 2) {
                recurringErrors.count = gettext('Must be greater than 1');
                messages.push(gettext('RECURRING REPEAT COUNT must be greater than 1'));
            }
        }
    }

    // If there are any recurring rule errors then set it
    // Otherwise delete the recurring rule errors
    if (!isEqual(recurringErrors, {})) {
        set(errors, 'recurring_rule', recurringErrors);
    }
};

const validateDates = (dispatch, getState, field, value, profile, errors, messages) => {
    if (!value) {
        return;
    }

    const newErrors = {};

    self.validateRequiredDates(value, newErrors, messages);
    self.validateDateRange(value, newErrors, messages);
    self.validateRecurringRules(getState, value, newErrors, messages);

    if (!isEqual(newErrors, {})) {
        errors.dates = newErrors;
    } else {
        delete errors.dates;
    }
};

const validateFiles = (dispatch, getState, field, value, profile, errors, messages) => {
    const error = {};

    formProfile(dispatch, field, value, profile, error);

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            if (isEmpty(item)) {
                set(error, `[${index}]`, gettext('Required'));
                messages.push(gettext(
                    'ATTACHED FILE {{ index }} is required',
                    {index: index + 1}
                ));
            }
        });
    }

    if (!isEqual(error, {})) {
        errors[field] = error;
    } else if (errors[field]) {
        delete errors[field];
    }
};

const validateLinks = (dispatch, getState, field, value, profile, errors, messages) => {
    const error = {};

    formProfile(dispatch, getState, field, value, profile, error, messages);

    const protocolTest = new RegExp('^(?:https?://|ftp://|www\\.)');

    if (Array.isArray(value)) {
        value.forEach((url, index) => {
            // Ignore empty URLs (we will delete these on save)
            if (get(url, 'length', 0) < 1) {
                return;
            }

            // Start validation once the url has a '.' in it
            if (url.indexOf('.') < 0) {
                return;
            }

            if (!url.match(protocolTest)) {
                set(error, `[${index}]`, gettext('Must start with "http://", "https://" or "www."'));
                messages.push(gettext(
                    'EXTERNAL LINK {{ index }} must start with "http://", "https://" or "www."',
                    {index: index + 1}
                ));
            } else if (url.endsWith('.')) {
                set(error, `[${index}]`, gettext('Cannot end with "."'));
                messages.push(gettext('EXTERNAL LINK {{ index }} cannot end with "."', {index: index + 1}));
            }
        });
    }

    if (!isEqual(error, {})) {
        errors[field] = error;
    } else if (errors[field]) {
        delete errors[field];
    }
};

// eslint-disable-next-line consistent-this
const self = {
    validateRequiredDates,
    validateDateRange,
    validateRecurringRules,
    validateDates,
    validateFiles,
    validateLinks,
};

export default self;
