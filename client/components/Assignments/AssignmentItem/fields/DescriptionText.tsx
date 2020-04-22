import React from 'react';
import {get} from 'lodash';

interface IProps {
    assignment: any;
}

export const DescriptionTextComponent = ({assignment}: IProps) => {
    const descriptionText = get(assignment, 'description_text');

    return <span>{descriptionText}</span>;
};
