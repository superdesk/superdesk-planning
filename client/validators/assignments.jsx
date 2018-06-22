import {get, isEmpty} from 'lodash';
import {gettext} from '../utils';

export const validateAssignment = ({field, value, errors, messages}) => {
    if (isEmpty(get(value, 'deskId'))) {
        errors.desk = gettext('This field is required');
        messages.push(gettext('{{ name }} is a required field', {name: field.toUpperCase()}));
    } else {
        delete errors.desk;
    }
};
