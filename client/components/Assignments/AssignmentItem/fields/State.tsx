import React from 'react';
import {Label} from 'superdesk-ui-framework/react';

import {superdeskApi} from '../../../../superdeskApi';
import {ASSIGNMENT_STATE} from '../../../../interfaces';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export function StateComponent({assignment}: IProps) {
    const {gettext} = superdeskApi.localization;
    const state = assignment.assigned_to?.state ?? ASSIGNMENT_STATE.DRAFT;
    let props: Label['props'];


    switch (state) {
    case ASSIGNMENT_STATE.DRAFT:
        props = {
            type: 'default',
            style: 'translucent',
            text: gettext('Draft'),
        };
        break;
    case ASSIGNMENT_STATE.ASSIGNED:
    case ASSIGNMENT_STATE.SUBMITTED:
        props = {
            type: 'default',
            style: 'translucent',
            text: gettext('Assigned'),
        };
        break;
    case ASSIGNMENT_STATE.IN_PROGRESS:
        props = {
            type: 'warning',
            style: 'translucent',
            text: gettext('In Progress'),
        };
        break;
    case ASSIGNMENT_STATE.COMPLETED:
        props = {
            type: 'success',
            style: 'translucent',
            text: gettext('Completed'),
        };
        break;
    case ASSIGNMENT_STATE.CANCELLED:
        props = {
            type: 'alert',
            style: 'translucent',
            text: gettext('Cancelled'),
        };
        break;
    default:
        return superdeskApi.helpers.assertNever(state);
    }

    return (
        <Label {...props} />
    );
}
