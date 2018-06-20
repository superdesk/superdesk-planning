import {get, isEmpty} from 'lodash';
import {gettext} from '../utils';

export const formProfile = (dispatch, getState, field, fieldValue, profile, errors, messages) => {
    // If the field is not enabled or no schema defined, then simply return
    if (!get(profile, `editor.${field}.enabled`, false) || !get(profile, `schema.${field}`)) {
        return;
    }

    const schema = get(profile, `schema.${field}`) || {};

    const value = (typeof fieldValue === 'string') ? fieldValue.trim() : fieldValue;

    /**
     * Get label for a field
     *
     * This should be temporary, we should define labels in the profile
     *
     * @param {String} field
     * @return {String}
     */
    const fieldLabel = (field) => {
        let label = field;

        if (profile.name === 'event') {
            if (field === 'name') {
                label = 'Event name';
            } else if (field === 'calendars') {
                label = 'Calendars';
            }
        }

        return gettext(label).toUpperCase();
    }

    if (!schema.required && get(value, length, 0) < 1) {
        return;
    }

    if (get(schema, 'maxlength', 0) > 0 && get(value, 'length', 0) > schema.maxlength) {
        if (get(schema, 'type', 'string') === 'list') {
            errors[field] = gettext('Too many ') + field;
            messages.push(gettext('Too many {{ name }}', {name: fieldLabel(field)}));
        } else {
            errors[field] = gettext('Too long');
            messages.push(gettext('{{ name }} is too long', {name: fieldLabel(field)}));
        }
    } else if (schema.required && (typeof value === 'number' ? !value : isEmpty(value))) {
        errors[field] = gettext('This field is required');
        messages.push(gettext('{{ name }} is a required field', {name: fieldLabel(field)}));
    } else if (get(schema, 'minlength', 0) > 0 && get(value, 'length', 0) < schema.minlength) {
        if (get(schema, 'type', 'string') === 'list') {
            errors[field] = gettext('Not enough');
            messages.push(gettext('Not enough {{ name }}', {name: fieldLabel(field)}));
        } else {
            errors[field] = gettext('Too short');
            messages.push(gettext('{{ name }} is too short', {name: fieldLabel(field)}));
        }
    } else {
        delete errors[field];
    }
};
