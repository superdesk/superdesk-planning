import {get, isEmpty} from 'lodash';
import {gettext} from '../utils';

export const formProfile = ({field, value, profile, errors, messages}) => {
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
    } else if (schema.required && (typeof fieldValue === 'number' ? !fieldValue : isEmpty(fieldValue))) {
        errors[field] = gettext('This field is required');
        messages.push(gettext('{{ name }} is a required field', {name: fieldLabel}));
    } else if (get(schema, 'minlength', 0) > 0 && get(fieldValue, 'length', 0) < schema.minlength) {
        if (get(schema, 'type', 'string') === 'list') {
            errors[field] = gettext('Not enough');
            messages.push(gettext('Not enough {{ name }}', {name: fieldLabel}));
        } else {
            errors[field] = gettext('Too short');
            messages.push(gettext('{{ name }} is too short', {name: fieldLabel}));
        }
    } else {
        delete errors[field];
    }
};
