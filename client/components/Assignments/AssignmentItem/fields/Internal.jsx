import React from 'react';
import {InternalNoteLabel} from '../../../InternalNoteLabel';

export const InternalComponent = ({assignment}) => (
    <InternalNoteLabel
        item={assignment}
        prefix="planning."
        marginRight={true}
        marginLeft={true}
    />
);
