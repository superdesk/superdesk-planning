import moment from 'moment';
import {get, set, isEqual, isEmpty} from 'lodash';

import {WORKSPACE, WORKFLOW_STATE, PRIVILEGES} from '../constants';
import * as selectors from '../selectors';
import {gettext, getItemInArrayById} from '../utils';

import {validateField, validators} from './index';

const validatePlanningScheduleDate = ({getState, field, value, errors, messages, diff, item}) => {
    // Only validate the schedule if it has changed
    if (moment(get(item, field)).isSame(moment(get(diff, field)))) {
        return;
    }

    const privileges = selectors.general.privileges(getState());
    const canCreateInPast = !!privileges[PRIVILEGES.CREATE_IN_PAST];
    const today = moment();

    if (moment.isMoment(value) && value.isBefore(today, 'day')) {
        set(errors, `${field}.date`, gettext('Planning date is in the past'));

        if (!canCreateInPast) {
            messages.push(gettext('PLANNING DATE cannot be in the past'));
        }
    }
};

export const validateCoverages = ({
    dispatch,
    getState,
    field,
    value,
    profile,
    errors,
    messages,
    diff,
    item,
}) => {
    const error = {};

    if (Array.isArray(value)) {
        value.forEach((coverage, index) => {
            const originalCoverage = getItemInArrayById(
                get(item, 'coverages') || [],
                get(coverage, 'coverage_id'),
                'coverage_id'
            );

            Object.keys(validators.coverage).forEach((key) => {
                const coverageErrors = {};
                let keyName = ['news_coverage_status', 'scheduled_updates'].includes(key) ? key : `planning.${key}`;
                let original = get(originalCoverage, keyName);
                let value = get(coverage, keyName);

                if (key === 'scheduled' && original !== undefined && isEqual(original, value)) {
                    // Only validate scheduled date if it has changed
                    return;
                } else if (get(coverage, 'planning.g2_content_type') !== 'text' && key === 'genre') {
                    // Only validate Genre if the content type is Text
                    return;
                }

                validateField({
                    dispatch: dispatch,
                    getState: getState,
                    profileName: 'coverage',
                    field: key,
                    value: value,
                    profile: profile,
                    errors: coverageErrors,
                    messages: messages,
                    diff: diff,
                });

                if (get(coverageErrors, key)) {
                    set(error, `${index}.${keyName}`, coverageErrors[key]);
                }
            });
        });
    }

    if (!isEqual(error, {})) {
        errors.coverages = error;
    } else if (errors.coverages) {
        delete errors.coverages;
    }
};

const validateCoverageScheduleDate = ({
    getState,
    field,
    value,
    profile,
    errors,
    messages,
}) => {
    if (get(profile, 'schema.scheduled.required') && !value) {
        if (!field.endsWith('_scheduledTime')) {
            set(errors, `${field}.date`, gettext('Required'));
            messages.push(gettext('COVERAGE SCHEDULED DATE is required'));
        } else {
            set(errors, field, gettext('Required'));
            messages.push(gettext('COVERAGE SCHEDULED TIME is required'));
        }

        return;
    }

    let validateSchedule = true;
    const newsItem = get(selectors.general.modalProps(getState()), 'newsItem', null);

    if (selectors.general.currentWorkspace(getState()) === WORKSPACE.AUTHORING && newsItem) {
        if ([WORKFLOW_STATE.SCHEDULED, 'published'].includes(newsItem.state)) {
            // We don't validate if newsitem is published/scheduled in add-to-planning modal
            validateSchedule = false;
        }
    }

    const privileges = selectors.general.privileges(getState());
    const canCreateInPast = !!privileges[PRIVILEGES.CREATE_IN_PAST];
    const today = moment();

    if (!field.endsWith('_scheduledTime') &&
            validateSchedule && moment.isMoment(value) && value.isBefore(today, 'day')) {
        set(errors, `${field}.date`, gettext('Date is in the past'));

        if (!canCreateInPast) {
            messages.push(gettext('COVERAGE SCHEDULED DATE cannot be in the past'));
        }
    }
};

const validateScheduledUpdatesDate = ({
    getState,
    field,
    value,
    profile,
    errors,
    messages,
    diff,
}) => {
    const coverageSchedule = get(get(diff, 'coverages', []).find((c) =>
        c.coverage_id === get(value, '[0].coverage_id')), 'planning.scheduled');

    errors.scheduled_updates = {};
    const planningSchedules = (value || []).map((v) => get(v, 'planning')).reverse();
    let requiredMissing, scheduleConflict;


    planningSchedules.forEach((planningSchedule, index) => {
        const schedule = get(planningSchedule, 'scheduled');
        const scheduledIndex = planningSchedules.length - 1 - index;
        const _scheduledTime = get(planningSchedule, '_scheduledTime');

        if (get(profile, 'schema.scheduled_updates_scheduled.required')) {
            if (!schedule || !_scheduledTime) {
                requiredMissing = true;
                errors.scheduled_updates[scheduledIndex] = {planning: {}};
                if (!schedule) {
                    errors.scheduled_updates[scheduledIndex].planning.scheduled = {date: gettext('Required')};
                }

                if (!_scheduledTime) {
                    errors.scheduled_updates[scheduledIndex].planning._scheduledTime = gettext('Required');
                }
            }
        }

        if (schedule && _scheduledTime) {
            const previousSchedule = schedule ? get((planningSchedules.slice(index + 1)).find((s) => s.scheduled),
                'scheduled') : null;

            if ((coverageSchedule && schedule <= coverageSchedule) ||
                    (previousSchedule && schedule <= previousSchedule)) {
                errors.scheduled_updates[planningSchedules.length - 1 - index] = {
                    planning: {
                        _scheduledTime: gettext('Should be after the previous scheduled update/coverage'),
                        scheduled: {
                            date: gettext('Should be after the previous scheduled update/coverage'),
                        },
                    },
                };
                scheduleConflict = true;
            }
        }
    });

    if (isEmpty(errors.scheduled_updates)) {
        delete errors.scheduled_updates;
    } else {
        if (scheduleConflict) {
            messages.push(gettext('Scheduled Upates have to be after the previous updates.'));
        }

        if (requiredMissing) {
            messages.push(gettext('Scheduled Upates should have a date/time.'));
        }
    }
};

// eslint-disable-next-line consistent-this
const self = {
    validatePlanningScheduleDate,
    validateCoverages,
    validateScheduledUpdatesDate,
    validateCoverageScheduleDate,
};

export default self;
