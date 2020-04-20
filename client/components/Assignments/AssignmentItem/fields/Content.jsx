import React from 'react';
import {assignmentUtils} from '../../../../utils';
import {Label} from '../../..';

export const ContentComponent = ({assignment}) => {
    const hasContent = assignmentUtils.assignmentHasContent(assignment);

    if (!hasContent) {
        return <span />;
    }

    return <Label text="Content" isHollow={true} iconType="darkBlue2" />;
};
