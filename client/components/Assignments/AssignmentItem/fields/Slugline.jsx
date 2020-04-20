import React from 'react';
import {get} from 'lodash';

export const SluglineComponent = ({assignment}) => {
    const slugline = get(assignment, 'planning.slugline');

    return <span className="sd-text__slugline">{slugline}</span>;
};
