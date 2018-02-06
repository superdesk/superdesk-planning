import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Dropdown = ({children, className, isOpen, alignRight}) => (
    <div
        className={classNames(
            'dropdown',
            {
                'dropdown--align-right': alignRight,
                open: isOpen
            },
            className
        )}
    >
        {children}
    </div>
);

Dropdown.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    isOpen: PropTypes.bool,
    alignRight: PropTypes.bool
};

Dropdown.defaultProps = {
    isOpen: false,
    alignRight: false
};
