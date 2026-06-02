import React from 'react';
import {InternalNoteLabel} from '../../../InternalNoteLabel';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const InternalComponent = ({assignment}: IProps) => (
    <InternalNoteLabel
        item={assignment}
        prefix="planning."
        marginRight={false}
        marginLeft={false}
    />
);
