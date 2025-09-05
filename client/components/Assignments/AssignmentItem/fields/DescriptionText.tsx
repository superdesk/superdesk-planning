import React from 'react';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const DescriptionTextComponent = ({assignment}: IProps) => {
    const descriptionText = assignment.description_text;

    return <span>{descriptionText}</span>;
};
