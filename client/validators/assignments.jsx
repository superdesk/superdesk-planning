import {get, isEmpty} from 'lodash';

export const validateAssignment = (dispatch, getState, field, assignment, profile, errors) => {
    if (isEmpty(get(assignment, 'deskId'))) {
        errors.desk = 'This field is required';
    } else {
        delete errors.desk;
    }
};
