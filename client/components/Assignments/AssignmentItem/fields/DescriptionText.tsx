import React from 'react';
import {get} from 'lodash';

interface IProps {
    assignment: any;
}

export const DescriptionTextComponent = ({assignment}: IProps) => {
    const descriptionText = get(assignment, 'description_text');

    return (
        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
            <span>{descriptionText}</span>
        </span>
    );
};
