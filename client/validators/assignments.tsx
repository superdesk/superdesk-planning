import {get, isEmpty} from 'lodash';
import {gettext} from '../utils';
import {appConfig} from 'appConfig';
import {IAssignmentItem} from '../interfaces';

export const validateAssignment = ({field, value, errors, messages}) => {
    if (isEmpty(get(value, 'deskId')) && appConfig.planning_auto_assign_to_workflow) {
        errors.desk = gettext('This field is required');
        messages.push(gettext('{{ name }} is a required field', {name: field.toUpperCase()}));
    } else {
        delete errors.desk;
    }
};

export function isAssignmentDeskValid(deskId?: IAssignmentItem['assigned_to']['desk']): boolean {
    return deskId != null || appConfig.planning_auto_assign_to_workflow !== true;
}
