import React from 'react';
import {PriorityLabel} from '../../../PriorityLabel';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const PriorityComponent = ({assignment, ...props}: IProps) => {
    const priorities = props.fieldsProps.priority.priorities;

    return (
        <PriorityLabel
            item={{priority: assignment.priority != null ? assignment.priority : undefined}}
            priorities={priorities}
            tooltipFlow="right"
            inline={true}
        />
    );
};
