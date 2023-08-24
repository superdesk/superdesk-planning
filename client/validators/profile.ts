import {get, isEmpty} from 'lodash';

import {IVocabularyItem, ISubject} from 'superdesk-api';
import {IEditorProfile, IProfileSchemaTypeList, IEventOrPlanningItem} from '../interfaces';
import {planningApi} from '../superdeskApi';

import {gettext} from '../utils';

export const formProfile = ({field, value, profile, errors, messages, diff}) => {
    // If the field is not enabled or no schema defined, then simply return
    if (!get(profile, `editor.${field}.enabled`, false) || !get(profile, `schema.${field}`)) {
        return;
    }

    const schema = get(profile, `schema.${field}`) || {};

    const fieldValue = (typeof value === 'string') ? value.trim() : value;

    if (!schema.required && get(fieldValue, length, 0) < 1) {
        return;
    }

    let fieldLabel = field;

    if (profile.name === 'event') {
        if (field === 'name') {
            fieldLabel = 'Event name';
        } else if (field === 'calendars') {
            fieldLabel = 'Calendars';
        }
    }

    fieldLabel = gettext(fieldLabel).toUpperCase();

    if (get(schema, 'maxlength', 0) > 0 && get(fieldValue, 'length', 0) > schema.maxlength) {
        if (get(schema, 'type', 'string') === 'list') {
            errors[field] = gettext('Too many {{ name }}', {name: field});
            messages.push(gettext('Too many {{ name }}', {name: fieldLabel}));
        } else {
            errors[field] = gettext('Too long');
            messages.push(gettext('{{ name }} is too long', {name: fieldLabel}));
        }
    } else if (schema.required && !schema.multilingual && (
        typeof fieldValue === 'number' ? !fieldValue : isEmpty(fieldValue))) {
        errors[field] = gettext('This field is required');
        messages.push(gettext('{{ name }} is a required field', {name: fieldLabel}));
    } else if (schema.required && schema.multilingual && field !== 'language') {
        const multilingualField = diff?.translations?.filter((e) => e.field === field) || [];
        const missingLangs = diff?.languages?.filter((lang) => !multilingualField.some((
            obj) => obj.language === lang)) || [];
        const emptyValues = multilingualField.filter((obj) => obj.value === '');

        missingLangs.forEach((qcode) => {
            const name = `${fieldLabel} (${qcode})`;
            const fieldError = `${field}.${qcode}`;

            errors[fieldError] = gettext('This field is required');
            messages.push(gettext('{{ name }} is a required field', {name}));
        });

        emptyValues.forEach(({language}) => {
            const name = `${fieldLabel} (${language})`;
            const fieldError = `${field}.${language}`;

            errors[fieldError] = gettext('This field is required');
            messages.push(gettext('{{ name }} is a required field', {name}));
        });

        Object.keys(errors).forEach((fieldError) => {
            const [fieldName, lang] = fieldError.split('.');

            if (fieldName === field && diff.languages.includes(lang)) {
                if (!missingLangs.includes(lang) && !emptyValues.some((obj) => obj.language === lang)) {
                    delete errors[fieldError];
                }
            }
        });
    } else if (get(schema, 'minlength', 0) > 0 && get(fieldValue, 'length', 0) < schema.minlength) {
        if (get(schema, 'type', 'string') === 'list') {
            errors[field] = gettext('Not enough');
            messages.push(gettext('Not enough {{ name }}', {name: fieldLabel}));
        } else {
            errors[field] = gettext('Too short');
            messages.push(gettext('{{ name }} is too short', {name: fieldLabel}));
        }
    } else if (schema.required && schema.multilingual && isEmpty(fieldValue)) {
        errors[field] = gettext('This field is required');
        messages.push(gettext('{{ name }} is a required field', {name: fieldLabel}));
    } else {
        delete errors[field];
    }
};

interface IValidateCustomCVArgs {
    field: string;
    value: undefined; // Value is `undefined`, as there is no field called `custom_vocabularies`
    profile: IEditorProfile;
    errors: {[field: string]: string};
    messages: Array<string>;
    diff: Partial<IEventOrPlanningItem>;
}

export function formProfileCustomVocabularies({field, value, profile, errors, messages, diff}: IValidateCustomCVArgs) {
    const schema = profile.schema?.[field];

    if (schema == null || schema.type !== 'list' || profile.editor[field]?.enabled !== true) {
        return;
    } else if (schema.required !== true) {
        return;
    }

    planningApi.vocabularies.getCustomVocabularies()
        .filter((cv) => schema.vocabularies?.includes(cv._id))
        .forEach((cv) => {
            const values = ((diff[cv.schema_field || 'subject'] || []) as Array<ISubject>).filter((item) => (
                item.scheme === cv._id
            ));
            const fieldName = `custom_vocabularies.${cv._id}`;
            const fieldLabel = cv.display_name.toUpperCase();

            if (!values.length) {
                errors[fieldName] = gettext('This field is required');
                messages.push(gettext('{{ name }} is a required field', {name: fieldLabel}));
            } else {
                delete errors[fieldName];
            }
        });
}
