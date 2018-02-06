export {ChainValidators} from './ChainValidators';
export {RequiredFieldsValidatorFactory} from './RequiredFieldsValidatorFactory';

import {default as eventValidators} from './events';
import {formProfile} from './profile';
import {validateAssignment} from './assignments';

export {eventValidators, formProfile, validateAssignment};

import {get, set, isEqual} from 'lodash';

export const validateField = (dispatch, getState, profileName, field, value, profile, errors) => {
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
                        // Set the errors for date and time fields
                        set(error, `${index}.${keyName}`, {
                            date: coverageErrors[key],
                            time: coverageErrors[key]
                        });
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

export const validators = {
    events: {
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
    },
    planning: {
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
        scheduled: [formProfile],
        slugline: [formProfile],
    },
    assignment: {
        _all: [validateAssignment],
    }
};
