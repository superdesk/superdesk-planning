import React from 'react';
import PropTypes from 'prop-types';
import {StateLabel} from '../../../StateLabel';

interface IProps {
    assignment: any;
}

export const StateComponent = ({assignment}: IProps) => (
    <StateLabel item={assignment.assigned_to} />
);
