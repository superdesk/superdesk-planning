import moment from 'moment';
import {get, set, isEmpty, isEqual, pick} from 'lodash';

import {appConfig} from 'appConfig';

import {gettext, eventUtils} from '../utils';
import * as selectors from '../selectors';
import {formProfile} from './profile';
import {PRIVILEGES, EVENTS, TO_BE_CONFIRMED_FIELD} from '../constants';

const validateRequiredDates = ({value, errors, messages, diff}) => {
    if (!get(value, 'start')) {
        set(errors, 'start.date', gettext('This field is required'));
        messages.push(gettext('START DATE is a required field'));
    }

    if (!get(value, 'end')) {
        set(errors, 'end.date', gettext('This field is required'));
        messages.push(gettext('END DATE is a required field'));
    }

    if (!get(value, 'tz')) {
        set(errors, 'tz', gettext('This field is required'));
        messages.push(gettext('TIMEZONE is a required field'));
    }

    if (!get(diff, TO_BE_CONFIRMED_FIELD)) {
        if (!get(value, '_startTime')) {
            set(errors, '_startTime', gettext('This field is required'));
            messages.push(gettext('START TIME is a required field'));
        }

        if (!get(value, '_endTime')) {
            set(errors, '_endTime', gettext('This field is required'));
            messages.push(gettext('END TIME is a required field'));
        }
    }
};

const validateDateRange = ({value, errors, messages}) => {
    let startDate = moment(value.start);
    let endDate = moment(value.end);

    if (!self.valdiateStartEndDateValues(value, startDate, endDate)) {
        return;
    }

    if (endDate.isSameOrBefore(startDate, 'minutes')) {
        if (eventUtils.isEventSameDay(value.start, value.end)) {
            set(errors, '_endTime', gettext('End time should be after start time'));
            messages.push(gettext('END TIME should be after START TIME'));
        } else {
            set(errors, 'end.date', gettext('End date should be after start date'));
            messages.push(gettext('END DATE should be after START DATE'));
        }
    }
};

const validateDateInPast = ({getState, value, errors, messages}) => {
    const privileges = selectors.general.privileges(getState());
    const canCreateInPast = !!privileges[PRIVILEGES.CREATE_IN_PAST];
    const today = moment();

    const startDate = get(value, 'start');
    const endDate = get(value, 'end');

    if (moment.isMoment(startDate) && startDate.isBefore(today, 'day')) {
        set(errors, 'start.date', gettext('Start date is in the past'));

        if (!canCreateInPast) {
            messages.push(gettext('START DATE cannot be in the past'));
        }
    }

    if (moment.isMoment(endDate) && endDate.isBefore(today, 'day')) {
        set(errors, 'end.date', gettext('End date is in the past'));

        if (!canCreateInPast) {
            messages.push(gettext('END DATE cannot be in the past'));
        }
    }
};

const validateRecurringRules = ({value, errors, messages}) => {
    const frequency = get(value, 'recurring_rule.frequency');
    const byday = get(value, 'recurring_rule.byday');
    const endRepeatMode = get(value, 'recurring_rule.endRepeatMode');
    const until = get(value, 'recurring_rule.until');
    const startDate = get(value, 'start');
    let count = get(value, 'recurring_rule.count');
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

            if (count > appConfig.max_recurrent_events) {
                const maximum = appConfig.max_recurrent_events + 1;

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

const validateMultiDayDuration = ({value, errors, messages}) => {
    let startDate = moment(value.start);
    let endDate = moment(value.end);

    if (!self.valdiateStartEndDateValues(value, startDate, endDate)) {
        return;
    }

    const diff = endDate.diff(startDate, 'minutes');
    const maxDuration = appConfig.max_multi_day_event_duration;

    if (maxDuration > 0 && diff > maxDuration * 1440) {
        const message = gettext('Event duration is greater than {{maxDuration}} days.', {maxDuration});

        set(errors, 'end.date', message);
        messages.push(message);
    }
};

const validateDates = ({getState, value, errors, messages, diff}) => {
    if (!value) {
        return;
    }

    let newErrors = {};
    const modalProps = selectors.general.modalProps(getState());

    self.validateRequiredDates({
        value: value,
        errors: newErrors,
        messages: messages,
        diff: diff,
    });
    self.validateDateRange({
        value: value,
        errors: newErrors,
        messages: messages,
    });

    // we don't have to validate all recurring form update time action
    // as only time is modified. we could be modifying a event that schedule
    // after until or difference could be greater than multi day duration
    if (get(modalProps, 'actionType', '') !== EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName) {
        self.validateDateInPast({
            getState: getState,
            value: value,
            errors: newErrors,
            messages: messages,
        });
        self.validateRecurringRules({
            value: value,
            errors: newErrors,
            messages: messages,
        });
        self.validateMultiDayDuration({
            value: value,
            errors: newErrors,
            messages: messages,
        });
    }

    const timeErrors = pick(newErrors, ['_startTime', '_endTime']);

    delete newErrors._startTime;
    delete newErrors._endTime;

    if (!isEqual(newErrors, {})) {
        errors.dates = newErrors;
    } else {
        delete errors.dates;
    }

    if (timeErrors._startTime) {
        errors._startTime = timeErrors._startTime;
    } else {
        delete errors._startTime;
    }

    if (timeErrors._endTime) {
        errors._endTime = timeErrors._endTime;
    } else {
        delete errors._endTime;
    }
};

const validateFiles = ({dispatch, getState, field, value, profile, errors, messages}) => {
    const error = {};

    formProfile({
        field: field,
        value: value,
        profile: profile,
        errors: error,
        messages: messages,
    });

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

const validateLinks = ({dispatch, getState, field, value, profile, errors, messages}) => {
    const error = {};

    formProfile({
        field: field,
        fieldValue: value,
        profile: profile,
        errors: error,
        messages: messages,
    });

    const protocolTest = new RegExp('^(?:https?://|ftp://|www\\.|bit\\.ly|goo\\.gl|t\\.co|youtu\\.be|tinyurl\\.)');

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

const valdiateStartEndDateValues = (value, startDate, endDate) => {
    if (!get(value, 'start') || !get(value, 'end') || !moment.isMoment(value.start) || !moment.isMoment(value.end) ||
        !get(value, '_startTime') || !get(value, '_endTime') || !moment.isMoment(value._startTime) ||
        !moment.isMoment(value._endTime)) {
        return false;
    }

    if (moment.isMoment(value._startTime)) {
        startDate.hour(value._startTime.hour()).minute(value._startTime.minute());
    }

    if (moment.isMoment(value._endTime)) {
        endDate.hour(value._endTime.hour()).minute(value._endTime.minute());
    }

    return true;
};

// eslint-disable-next-line consistent-this
const self = {
    validateRequiredDates,
    validateDateRange,
    validateDateInPast,
    validateRecurringRules,
    validateDates,
    validateFiles,
    validateLinks,
    validateMultiDayDuration,
    valdiateStartEndDateValues,
};

export default self;
