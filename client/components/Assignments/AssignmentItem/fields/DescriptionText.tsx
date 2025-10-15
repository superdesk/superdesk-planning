import React from 'react';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';
import {stringUtils} from '../../../../utils';

type IProps = IAssignmentListItemField;

export const DescriptionTextComponent = ({assignment}: IProps) => {
    const descriptionText = assignment.description_text;

    if (!descriptionText) return null;

    const plainText = stringUtils.convertHtmlToPlainText(descriptionText);

    return <span>{plainText}</span>;
};
