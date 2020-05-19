import React from 'react';
import PropTypes from 'prop-types';
import {InternalNoteLabel} from '../../../InternalNoteLabel';

interface IProps {
    assignment: any;
}

export const InternalComponent = ({assignment}: IProps) => (
    <InternalNoteLabel
        item={assignment}
        prefix="planning."
        marginRight={true}
        marginLeft={true}
    />
);
