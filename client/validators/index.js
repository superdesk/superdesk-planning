import moment from 'moment';
import {get, set, isEqual, omit, isEmpty} from 'lodash';

import {WORKSPACE, WORKFLOW_STATE, PRIVILEGES} from '../constants';
import * as selectors from '../selectors';
import {gettext, getItemInArrayById} from '../utils';

import {default as eventValidators} from './events';
import {formProfile} from './profile';
import {validateAssignment} from './assignments';

export {eventValidators, formProfile, validateAssignment};

export const validateField = ({
    dispatch,
    getState,
    profileName,
    field,
    value,
    profile,
    errors,
    messages,
    diff,
    item,
}) => {
    if (get(profile, `schema.${field}.validate_on_post`)) {
        return;
    }

    const funcs = get(validators[profileName], field, []) || [formProfile];

    funcs.forEach((func) => func({
        dispatch,
        getState,
        field,
        value,
        profile,
        errors,
        messages,
        diff,
        item,
    }));
};

export const validateItem = ({
    profileName,
    diff,
    item = {},
    formProfiles,
    errors,
    messages = [],
    fields = null,
    ignoreDateValidation = false,
}) => (
    (dispatch, getState) => {
        const profiles = formProfiles ? formProfiles : selectors.forms.profiles(getState());

        const getValue = (key) => (
            key !== 'dates' ? get(diff, key) : {
                ...get(diff, key),
                _startTime: get(diff, '_startTime'),
                _endTime: get(diff, '_endTime'),
            }
        );

        const profile = get(profiles, profileName);

        if (get(profile, 'schema')) {
            // validate custom fields
            Object.keys(profile.schema).filter((key) => !validators[profileName][key])
                .forEach((key) => {
                    const schema = profile.schema[key];

                    switch (true) {
                    case schema.required:
                        if (isEmpty(diff[key]) && isEmpty(getSubject(diff, key))) {
                            errors[key] = gettext('This field is required');
                            messages.push(gettext('{{ key }} is a required field', {key: key.toUpperCase()}));
                        } else if (errors[key]) {
                            errors[key] = null;
                        }
                        break;
                    }
                });
        }

        return (fields || Object.keys(
            ignoreDateValidation ? omit(validators[profileName], 'dates') : validators[profileName])).forEach((key) => (
            validateField({
                dispatch: dispatch,
                getState: getState,
                profileName: profileName,
                field: key,
                value: key === '_all' ? diff : getValue(key),
                profile: key !== 'coverages' ? profiles[profileName] : profiles.coverage,
                errors: errors,
                messages: messages,
                diff: diff,
                item: item,
            })
        ));
    }
);

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
                    diff: diff
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

const validatePlanningScheduleDate = ({getState, field, value, errors, messages, diff, item}) => {
    // Only validate the schedule if it has changed
    // if (isEqual(moment(get(item, field)), moment(get(diff, field)))) {
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

const validateScheduledUpdatesDate = ({
    getState,
    field,
    value,
    profile,
    errors,
    messages,
    diff,
}) => {
    const coverageSchedule = get(get(diff, 'coverages', []).find((c) => c.coverage_id === get(value, '[0].coverage_id')),
        'planning.scheduled')
    errors.scheduled_updates = {}
    const planningSchedules = (value || []).map((v) => get(v, 'planning')).reverse();
    let requiredMissing, scheduleConflict


    planningSchedules.forEach((planningSchedule, index) => {
        const schedule = get(planningSchedule, 'scheduled')
        const scheduledIndex = planningSchedules.length -1 - index
        const _scheduledTime = get(planningSchedule, '_scheduledTime')
        if (get(profile, 'schema.scheduled_updates_scheduled.required')) {
            if (!schedule || !_scheduledTime) {
                requiredMissing = true
                errors.scheduled_updates[scheduledIndex] =  { 'planning': {} }
                if (!schedule) {
                    errors.scheduled_updates[scheduledIndex].planning.scheduled = { 'date': gettext('Required') }
                }

                if (!_scheduledTime) {
                    errors.scheduled_updates[scheduledIndex].planning._scheduledTime = gettext('Required')
                }
            }
        } 

        if (schedule && _scheduledTime) {
            const previousSchedule = schedule ? (planningSchedules.slice(index + 1)).find((s) => s) : null
            const fieldName = `${index}.planning`
            if ((coverageSchedule && schedule <= coverageSchedule) || (previousSchedule && schedule <= previousSchedule)) {
                errors.scheduled_updates[planningSchedules.length -1 - index] = {
                    'planning': {
                        '_scheduledTime': gettext('Should be after the previous scheduled update/coverage'),
                        'scheduled': {
                            'date': gettext('Should be after the previous scheduled update/coverage'),
                        }
                    }
                }
                scheduleConflict = true
            }
        }
    })

    if (isEmpty(errors.scheduled_updates)) {
        delete errors.scheduled_updates
    } else {
        if (scheduleConflict) {
            messages.push(gettext('Scheduled Upates have to be after the previous updates.'));    
        }
        
        if (requiredMissing) {
            messages.push(gettext('Scheduled Upates should have a date/time.'));
        }
    }
};

export const validators = {
    event: {
        anpa_category: [formProfile],
        calendars: [formProfile],
        definition_long: [formProfile],
        definition_short: [formProfile],
        event_contact_info: [formProfile],
        files: [eventValidators.validateFiles],
        internal_note: [formProfile],
        links: [eventValidators.validateLinks],
        location: [formProfile],
        name: [formProfile],
        occur_status: [formProfile],
        slugline: [formProfile],
        dates: [eventValidators.validateDates],
        ednote: [formProfile],
    },
    planning: {
        planning_date: [formProfile, validatePlanningScheduleDate],
        agendas: [formProfile],
        anpa_category: [formProfile],
        description_text: [formProfile],
        ednote: [formProfile],
        headline: [formProfile],
        internal_note: [formProfile],
        slugline: [formProfile],
        subject: [formProfile],
        urgency: [formProfile],
        coverages: [validateCoverages],
    },
    coverage: {
        ednote: [formProfile],
        g2_content_type: [formProfile],
        genre: [formProfile],
        headline: [formProfile],
        internal_note: [formProfile],
        keyword: [formProfile],
        scheduled: [validateCoverageScheduleDate],
        _scheduledTime: [validateCoverageScheduleDate],
        slugline: [formProfile],
        scheduled_updates: [validateScheduledUpdatesDate]
    },
    assignment: {
        _all: [validateAssignment],
    },
};

function getSubject(item, scheme) {
    return get(item, 'subject', [])
        .filter((subject) => scheme != null ? subject.scheme === scheme : isEmpty(subject.scheme));
}
