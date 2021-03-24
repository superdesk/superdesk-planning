import {get, omit, isEmpty} from 'lodash';

import * as selectors from '../selectors';
import {gettext} from '../utils';

import {default as eventValidators} from './events';
import {default as planningValidators} from './planning';
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
    fieldsToValidate,
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
                        if (isEmpty(diff[key]) && isEmpty(getSubject(diff, key))
                            && fieldsToValidate == null
                            || (Array.isArray(fieldsToValidate) && fieldsToValidate.includes(key))) {
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

export const validators = {
    event: {
        anpa_category: [formProfile],
        calendars: [formProfile],
        language: [formProfile],
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
        planning_date: [formProfile, planningValidators.validatePlanningScheduleDate],
        agendas: [formProfile],
        anpa_category: [formProfile],
        description_text: [formProfile],
        ednote: [formProfile],
        headline: [formProfile],
        internal_note: [formProfile],
        slugline: [formProfile],
        subject: [formProfile],
        urgency: [formProfile],
        coverages: [planningValidators.validateCoverages],
    },
    coverage: {
        ednote: [formProfile],
        g2_content_type: [formProfile],
        genre: [formProfile],
        headline: [formProfile],
        internal_note: [formProfile],
        keyword: [formProfile],
        scheduled: [planningValidators.validateCoverageScheduleDate],
        _scheduledTime: [planningValidators.validateCoverageScheduleDate],
        slugline: [formProfile],
        scheduled_updates: [planningValidators.validateScheduledUpdatesDate],
    },
    assignment: {
        _all: [validateAssignment],
    },
};

function getSubject(item, scheme) {
    return get(item, 'subject', [])
        .filter((subject) => scheme != null ? subject.scheme === scheme : isEmpty(subject.scheme));
}
