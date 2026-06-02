import React from 'react';
import {PriorityLabel} from '../../../PriorityLabel';
import {IAssignmentListItemField} from '../../interfaces';
import {assignmentFieldsConfig} from '../../../Coverages/assignmentFieldsConfig';

type IProps = IAssignmentListItemField;

export const PriorityComponent = ({assignment, ...props}: IProps) => {
    if (!assignmentFieldsConfig.assignmentPriority) {
        return null;
    }

    const priorities = props.fieldsProps.priority.priorities;

    return (
        // wrapping in a div to prevent assignment list view from applying flex shrink styles to inline block
        <div>
            <PriorityLabel
                item={{priority: assignment.priority != null ? assignment.priority : undefined}}
                priorities={priorities}
                tooltipFlow="right"
                inline={false}
            />
        </div>
    );
};
