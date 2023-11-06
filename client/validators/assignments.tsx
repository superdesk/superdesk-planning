import {get, isEmpty} from 'lodash';
import {gettext} from '../utils';
import {IPlanningConfig} from '../interfaces';
import * as config from 'appConfig';
const appConfig = config.appConfig as IPlanningConfig;

export const validateAssignment = ({field, value, errors, messages}) => {
    if (isEmpty(get(value, 'deskId')) && appConfig.planning_auto_assign_to_workflow) {
        errors.desk = gettext('This field is required');
        messages.push(gettext('{{ name }} is a required field', {name: field.toUpperCase()}));
    } else {
        delete errors.desk;
    }
};
