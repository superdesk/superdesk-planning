export {ChainValidators} from './ChainValidators';
export {RequiredFieldsValidatorFactory} from './RequiredFieldsValidatorFactory';

import {default as eventValidators} from './events';
import {formProfile} from './profile';
import {validateAssignment} from './assignments';

export {eventValidators, formProfile, validateAssignment};

import {get, set, isEqual} from 'lodash';
import {WORKSPACE, WORKFLOW_STATE} from '../constants';
import * as selectors from '../selectors';

export const validateField = (dispatch, getState, profileName, field, value, profile, errors) => {
    if (get(profile, `schema.${field}.validate_on_publish`)) {
        return;
    }

    const funcs = get(validators[profileName], field, []) || [formProfile];

    funcs.forEach((func) => func(dispatch, getState, field, value, profile, errors));
};

export const validateItem = (profileName, item, formProfiles, errors, fields = null) => (
    (dispatch, getState) => (
        (fields || Object.keys(validators[profileName])).forEach((key) => (
            validateField(
                dispatch,
                getState,
                profileName,
                key,
                key === '_all' ? item : get(item, key),
                key !== 'coverages' ? formProfiles[profileName] : formProfiles.coverage,
                errors
            )
        ))
    )
);

export const validateCoverages = (dispatch, getState, field, value, profile, errors) => {
    const error = {};

    if (Array.isArray(value)) {
        value.forEach((coverage, index) => (
            Object.keys(validators.coverage).forEach((key) => {
                // Genre is only used for 'text' content types
                if (get(coverage, 'planning.g2_content_type') !== 'text' && key === 'genre') {
                    return;
                }

                const coverageErrors = {};
                const keyName = key === 'news_coverage_status' ? key : `planning.${key}`;

                // For existing coverages, no validation on scheduled
                if (key === 'scheduled' && !!coverage.coverage_id) {
                    return;
                }

                validateField(
                    dispatch,
                    getState,
                    'coverage',
                    key,
                    get(coverage, keyName),
                    profile,
                    coverageErrors
                );

                if (get(coverageErrors, key)) {
                    if (key === 'scheduled') {
                        // Set the errors for the date field
                        set(error, `${index}.${keyName}`, {date: coverageErrors[key]});
                    } else {
                        set(error, `${index}.${keyName}`, coverageErrors[key]);
                    }
                }
            })
        ));
    }

    if (!isEqual(error, {})) {
        errors.coverages = error;
    } else if (errors.coverages) {
        delete errors.coverages;
    }
};

const validateCoverageScheduleDate = (dispatch, getState, field, value, profile, errors) => {
    if (get(profile, 'schema.scheduled.required') && !value) {
        errors[field] = gettext('Required');
        return;
    }

    let validateSchedule = true;
    const {newsItem} = selectors.getCurrentModalProps(getState());

    if (selectors.getCurrentWorkspace(getState()) === WORKSPACE.AUTHORING && newsItem) {
        if ([WORKFLOW_STATE.SCHEDULED, 'published'].includes(newsItem.state)) {
            // We don't validate if newsitem is published/scheduled in add-to-planning modal
            validateSchedule = false;
        }
    }

    if (validateSchedule && moment.isMoment(value) && value.isBefore(moment(), 'day')) {
        errors[field] = 'Date cannot be in past';
    }
};

export const validators = {
    event: {
        anpa_category: [formProfile],
        calendars: [formProfile],
        definition_long: [formProfile],
        definition_short: [formProfile],
        event_contact_info: [formProfile],
        files: [eventValidators.validateFilesAndLinks],
        internal_note: [formProfile],
        links: [eventValidators.validateFilesAndLinks],
        location: [formProfile],
        name: [formProfile],
        occur_status: [formProfile],
        slugline: [formProfile],
        dates: [eventValidators.validateDates],
        ednote: [formProfile],
    },
    planning: {
        planning_date: [formProfile],
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
    }
};
