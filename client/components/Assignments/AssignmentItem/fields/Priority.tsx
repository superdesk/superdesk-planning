import React from 'react';
import PropTypes from 'prop-types';
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
