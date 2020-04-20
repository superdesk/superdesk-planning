import React from 'react';
import {get} from 'lodash';

export const DescriptionTextComponent = ({assignment}) => {
    const descriptionText = get(assignment, 'description_text');

    return (
        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
            <span>{descriptionText}</span>
        </span>
    );
};
