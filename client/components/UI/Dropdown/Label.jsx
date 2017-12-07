import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Label = ({children, className}) => (
    <li
        className={classNames(
            'dropdown__menu-label',
            className
        )}
    >
        {children}
    </li>
);

Label.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};
