import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

interface IProps {
    assignment: any;
}

export const SluglineComponent = ({assignment}: IProps) => {
    const slugline = get(assignment, 'planning.slugline');

    return <span className="sd-text__slugline">{slugline}</span>;
};
