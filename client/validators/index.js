export {ChainValidators} from './ChainValidators';
export {RequiredFieldsValidatorFactory} from './RequiredFieldsValidatorFactory';

import {default as eventValidators} from './events';
import {formProfile} from './profile';
import {validateAssignment} from './assignments';

export {eventValidators, formProfile, validateAssignment};

import {get, set, isEqual} from 'lodash';
import {WORKSPACE, WORKFLOW_STATE} from '../constants';
import * as selectors from '../selectors';
import {gettext} from '../utils';

export const validateField = (dispatch, getState, profileName, field, value, profile, errors, messages) => {
    if (get(profile, `schema.${field}.validate_on_post`)) {
        return;
    }

    const funcs = get(validators[profileName], field, []) || [formProfile];

    funcs.forEach((func) => func(dispatch, getState, field, value, profile, errors, messages));
};

export const validateItem = (profileName, item, formProfiles, errors, messages = [], fields = null) => (
    (dispatch, getState) => (
        (fields || Object.keys(validators[profileName])).forEach((key) => (
            validateField(
                dispatch,
                getState,
                profileName,
                key,
                key === '_all' ? item : get(item, key),
                key !== 'coverages' ? formProfiles[profileName] : formProfiles.coverage,
                errors,
                messages
            )
        ))
    )
);

export const validateCoverages = (dispatch, getState, field, value, profile, errors, messages) => {
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
                    coverageErrors,
                    messages
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

const validateCoverageScheduleDate = (dispatch, getState, field, value, profile, errors, messages) => {
    if (get(profile, 'schema.scheduled.required') && !value) {
        errors[field] = gettext('Required');
        messages.push(gettext('COVERAGE SCHEDULED DATE/TIME are required fields'));
        return;
    }

    let validateSchedule = true;
    const newsItem = get(selectors.general.modalProps(getState()), 'newsItem', null);

    if (selectors.getCurrentWorkspace(getState()) === WORKSPACE.AUTHORING && newsItem) {
        if ([WORKFLOW_STATE.SCHEDULED, 'published'].includes(newsItem.state)) {
            // We don't validate if newsitem is published/scheduled in add-to-planning modal
            validateSchedule = false;
        }
    }

    if (validateSchedule && moment.isMoment(value) && value.isBefore(moment(), 'day')) {
        errors[field] = 'Date cannot be in past';
        messages.push(gettext('COVERAGE SCHEDULED DATE cannot be in the past'));
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
    },
};
