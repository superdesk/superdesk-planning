import React from 'react';
import {assignmentUtils} from '../../../../utils';
import {Label} from '../../..';

interface IProps {
    assignment: any;
}

export const ContentComponent = ({assignment}: IProps) => {
    const hasContent = assignmentUtils.assignmentHasContent(assignment);

    if (!hasContent) {
        return null;
    }

    return <Label text="Content" isHollow={true} iconType="darkBlue2" />;
};
