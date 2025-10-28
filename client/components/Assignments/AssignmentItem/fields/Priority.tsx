import React from 'react';
import {PriorityLabel} from '../../../PriorityLabel';
import {assignmentFieldsConfig} from '../../../Coverages/assignmentFieldsConfig';

interface IProps {
    assignment: any;
    priorities: any;
}

export const PriorityComponent = ({assignment, priorities}: IProps) => {
    if (!assignmentFieldsConfig.assignmentPriority) {
        return null;
    }

    return (
        <PriorityLabel
            item={assignment}
            priorities={priorities}
            tooltipFlow="right"
            inline={true}
        />
    );
};
