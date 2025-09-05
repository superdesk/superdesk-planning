import React from 'react';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const NameComponent = ({assignment}: IProps) => {
    const name = assignment.name;

    if (!name) {
        return null;
    }

    return (
        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
            <span>{name}</span>
        </span>
    );
};
