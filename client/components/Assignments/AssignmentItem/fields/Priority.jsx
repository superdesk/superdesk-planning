import React from 'react';
import {PriorityLabel} from '../../../PriorityLabel';

export const PriorityComponent = ({assignment, priorities}) => (
    <PriorityLabel
        item={assignment}
        priorities={priorities}
        tooltipFlow="right"
        inline={true}
    />
);
