import React from 'react';
import {StateLabel} from '../../../StateLabel';

export const StateComponent = ({assignment}) => (
    <StateLabel item={assignment.assigned_to} />
);
