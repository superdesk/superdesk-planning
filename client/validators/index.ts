import {get, omit, isEmpty} from 'lodash';

import * as selectors from '../selectors';
import {gettext} from '../utils';

import {default as eventValidators} from './events';
import {default as planningValidators} from './planning';
import {formProfile} from './profile';
import {validateAssignment} from './assignments';
import {IAssignmentOrPlanningItem, IFormProfileItem} from 'interfaces';
import {getFieldNameTranslated} from '../utils/contentProfiles';
import {vocabularies} from '../api/vocabularies';

export {eventValidators, formProfile, validateAssignment};

interface IValidateFieldProps {
    dispatch: () => any;
    getState: () => any;
    profileName: string;
    field: keyof IAssignmentOrPlanningItem;
    value: any;
    profile: IFormProfileItem;
    errors: any;
    messages: any;
    diff: any;
    item: any;
}

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
}: IValidateFieldProps) => {
    if (profile?.schema?.[field]?.validate_on_post) {
        return;
    }

    const validatorsForField = validators[profileName]?.[field] ?? [formProfile];

    validatorsForField.forEach((func) =>
        func({
            dispatch,
            getState,
            field,
            value,
            profile,
            errors,
            messages,
            diff,
            item,
        }),
    );
};

export const validateItem = ({
    profileName,
    diff,
    item = {},
    formProfiles = null,
    errors,
    messages = [],
    fields = null,
    ignoreDateValidation = false,
    fieldsToValidate = null,
}) => (
    (dispatch, getState) => {
        const profiles = formProfiles ? formProfiles : selectors.forms.profiles(getState());
        const getValue = (key) => (
            key !== 'dates' ? get(diff, key) : {
                ...get(diff, key),
                _startTime: diff._startTime,
                _endTime: diff._endTime,
            }
        );
        const profile = profiles[profileName];

        /*
        * Custom fields validation
        */
        if (profile?.schema) {
            const vocabularyLabels = new Map(vocabularies.getCustomVocabularies().map((x) => [x._id, x.display_name]));

            Object.keys(profile?.schema ?? []).filter((fieldId) => {
                const hasNoDefinedValidator = !validators[profileName][fieldId] && profile.schema[fieldId] != null;

                return hasNoDefinedValidator;
            })
                .forEach((fieldId) => {
                    const fieldSchema = profile.schema[fieldId];
                    const isNotIntegerAndEmpty = fieldSchema.type !== 'integer' && isEmpty(diff[fieldId]);
                    const isIntegerAndEmpty = fieldSchema.type === 'integer' && diff[fieldId] == null;
                    const isValidSubject = isEmpty(getVocabularyItemsForScheme(diff, fieldId))
                        && fieldsToValidate == null
                        || (Array.isArray(fieldsToValidate) && fieldsToValidate.includes(fieldId));

                    if (
                        fieldSchema.required
                        && (isNotIntegerAndEmpty || isIntegerAndEmpty)
                        && isValidSubject
                    ) {
                        errors[fieldId] = gettext('This field is required');

                        // Pass a field label matching field label in the editor UI
                        const fieldLabel = (() => {
                            if (fieldSchema?.type === 'custom_vocabulary') {
                                return vocabularyLabels.get(fieldId);
                            }

                            return getFieldNameTranslated(fieldId);
                        })();

                        messages.push(gettext('{{ key }} is a required field', {key: fieldLabel}));
                    } else if (errors[fieldId]) {
                        errors[fieldId] = null;
                    }
                });
        }

        const fieldsCleaned = fields || Object.keys(
            ignoreDateValidation
                ? omit(validators[profileName], 'dates')
                : validators[profileName],
        );

        fieldsCleaned.forEach((key) => {
            validateField({
                dispatch: dispatch,
                getState: getState,
                profileName: profileName,
                field: key,
                value: key === '_all' ? diff : getValue(key),
                profile: key !== 'coverages' ? profiles[profileName] : undefined,
                errors: errors,
                messages: messages,
                diff: diff,
            });
        });
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
        subject: [formProfile],
        invitation_details: [formProfile],
        registration_details: [formProfile],
        accreditation_infotype: [formProfile],
        accreditation_deadline: [formProfile],
        related_items: [formProfile],
        recurring_rules: [eventValidators.validateRecurringRules],
        place: [formProfile],
        reference: [formProfile],
        related_plannings: [formProfile],
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
        place: [formProfile],
        name: [formProfile],
    },
    coverage: {
        ednote: [formProfile],
        g2_content_type: [formProfile],
        genre: [formProfile],
        headline: [formProfile],
        internal_note: [formProfile],
        keyword: [formProfile],
        scheduled: [planningValidators.validateCoverageScheduleDate],

        // FIXME: Removed validation, because now we validate both date and time through `scheduled` field
        // In the future we will drop _scheduledTime from the whole codebase
        // _scheduledTime: [planningValidators.validateCoverageScheduleDate],
        slugline: [formProfile],
        scheduled_updates: [planningValidators.validateScheduledUpdatesDate],
        language: [formProfile],
    },
    assignment: {
        _all: [validateAssignment],
    },
};

export function getVocabularyItemsForScheme(item, scheme) {
    return (item?.subject ?? [])
        .filter((subject) => scheme != null ? subject.scheme === scheme : isEmpty(subject.scheme));
}
