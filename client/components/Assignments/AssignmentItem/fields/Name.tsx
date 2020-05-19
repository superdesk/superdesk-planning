import React from 'react';
import PropTypes from 'prop-types';

interface IProps {
    assignment: any;
}

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
