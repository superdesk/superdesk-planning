import React from 'react';
import {PriorityLabel} from '../../../PriorityLabel';

interface IProps {
    assignment: any;
    priorities: any;
}

export const PriorityComponent = ({assignment, priorities}: IProps) => (
    <PriorityLabel
        item={assignment}
        priorities={priorities}
        tooltipFlow="right"
        inline={true}
    />
);
