import React from 'react';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const SluglineComponent = ({assignment}: IProps) => {
    const slugline = assignment.planning?.slugline;

    return <span className="sd-text__slugline">{slugline}</span>;
};
