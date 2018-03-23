import {get, isEmpty} from 'lodash';
import {gettext} from '../utils';

export const formProfile = (dispatch, getState, field, fieldValue, profile, errors) => {
    // If the field is not enabled or no schema defined, then simply return
    if (!get(profile, `editor.${field}.enabled`, false) || !get(profile, `schema.${field}`)) {
        return;
    }

    const schema = get(profile, `schema.${field}`) || {};

    const value = (typeof fieldValue === 'string') ? fieldValue.trim() : fieldValue;

    if (!schema.required && get(value, length, 0) < 1) {
        return;
    }

    if (get(schema, 'maxlength', 0) > 0 && get(value, 'length', 0) > schema.maxlength) {
        if (get(schema, 'type', 'string') === 'list') {
            errors[field] = gettext('Too many ') + field;
        } else {
            errors[field] = gettext('Too long');
        }
    } else if (schema.required && (typeof value === 'number' ? !value : isEmpty(value))) {
        errors[field] = gettext('This field is required');
    } else if (get(schema, 'minlength', 0) > 0 && get(value, 'length', 0) < schema.minlength) {
        errors[field] = gettext('Too short');
    } else {
        delete errors[field];
    }
};
