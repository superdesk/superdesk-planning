import moment from 'moment';
import {get, set, isEmpty, isEqual} from 'lodash';
import {gettext, eventUtils} from '../utils';
import * as selectors from '../selectors';
import {formProfile} from './profile';

const validateRequiredDates = (dates, errors) => {
    if (!get(dates, 'start')) {
        set(errors, 'start.date', gettext('This field is required'));
        set(errors, 'start.time', gettext('This field is required'));
    }

    if (!get(dates, 'end')) {
        set(errors, 'end.date', gettext('This field is required'));
        set(errors, 'end.time', gettext('This field is required'));
    }
};

const validateDateRange = (dates, errors) => {
    const startDate = get(dates, 'start');
    const endDate = get(dates, 'end');

    if (moment.isMoment(startDate) &&
        moment.isMoment(endDate) &&
        endDate.isSameOrBefore(startDate)
    ) {
        if (eventUtils.isEventSameDay(startDate, endDate)) {
            set(errors, 'end.time', gettext('End time should be after start time'));
        } else {
            set(errors, 'end.date', gettext('End date should be after start date'));
        }
    }
};

const validateRecurringRules = (getState, dates, errors) => {
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
    }

    if (frequency === 'WEEKLY' && !byday) {
        recurringErrors.byday = gettext('Required');
    }

    if (endRepeatMode === 'until' && !until) {
        recurringErrors.until = gettext('Required');
    }

    if (endRepeatMode === 'count') {
        if (!count) {
            recurringErrors.count = gettext('Required');
        } else {
            count = parseInt(count, 10);

            if (count > maxRecurringEvents) {
                recurringErrors.count = gettext('Must be less than ') + (maxRecurringEvents + 1);
            } else if (count < 2) {
                recurringErrors.count = gettext('Must be greater than 1');
            }
        }
    }

    // If there are any recurring rule errors then set it
    // Otherwise delete the recurring rule errors
    if (!isEqual(recurringErrors, {})) {
        set(errors, 'recurring_rule', recurringErrors);
    }
};

const validateDates = (dispatch, getState, field, value, profile, errors) => {
    if (!value) {
        return;
    }

    const newErrors = {};

    self.validateRequiredDates(value, newErrors);
    self.validateDateRange(value, newErrors);
    self.validateRecurringRules(getState, value, newErrors);

    if (!isEqual(newErrors, {})) {
        errors.dates = newErrors;
    } else {
        delete errors.dates;
    }
};

const validateFiles = (dispatch, getState, field, value, profile, errors) => {
    const error = {};

    formProfile(dispatch, field, value, profile, error);

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            if (isEmpty(item)) {
                set(error, `[${index}]`, gettext('Required'));
            }
        });
    }

    if (!isEqual(error, {})) {
        errors[field] = error;
    } else if (errors[field]) {
        delete errors[field];
    }
};

const validateLinks = (dispatch, getState, field, value, profile, errors) => {
    const error = {};

    formProfile(dispatch, field, value, profile, error);

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
            } else if (url.endsWith('.')) {
                set(error, `[${index}]`, gettext('Cannot end with "."'));
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
