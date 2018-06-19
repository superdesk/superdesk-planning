import moment from 'moment';
import {get, set, isEqual} from 'lodash';

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
}) => (
    (dispatch, getState) => (
        (fields || Object.keys(validators[profileName])).forEach((key) => (
            validateField({
                dispatch: dispatch,
                getState: getState,
                profileName: profileName,
                field: key,
                value: key === '_all' ? diff : get(diff, key),
                profile: key !== 'coverages' ? formProfiles[profileName] : formProfiles.coverage,
                errors: errors,
                messages: messages,
                diff: diff,
                item: item,
            })
        ))
    )
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
                const keyName = key === 'news_coverage_status' ? key : `planning.${key}`;

                const original = get(originalCoverage, keyName);
                const value = get(coverage, keyName);

                if (key === 'scheduled' && isEqual(original, value)) {
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
        set(errors, `${field}.date`, gettext('Required'));
        set(errors, `${field}.time`, gettext('Required'));
        messages.push(gettext('COVERAGE SCHEDULED DATE is required'));
        messages.push(gettext('COVERAGE SCHEDULED TIME is required'));
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

    if (validateSchedule && moment.isMoment(value) && value.isBefore(today, 'day')) {
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
        slugline: [formProfile],
    },
    assignment: {
        _all: [validateAssignment],
    },
};
