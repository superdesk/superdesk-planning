import {get, isEmpty} from 'lodash';
import {gettext} from '../utils';

export const validateAssignment = (dispatch, getState, field, assignment, profile, errors, messages) => {
    if (isEmpty(get(assignment, 'deskId'))) {
        errors.desk = gettext('This field is required');
        messages.push(gettext('{{ name }} is a required field', {name: field.toUpperCase()}));
    } else {
        delete errors.desk;
    }
};
