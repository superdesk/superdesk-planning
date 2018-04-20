import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Dropdown = ({children, className, isOpen, alignRight, dropUp}) => (
    <div
        className={classNames(
            'dropdown',
            {
                'dropdown--align-right': alignRight,
                open: isOpen,
            },
            {'dropdown--dropup': dropUp},
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
    alignRight: PropTypes.bool,
    dropUp: PropTypes.bool,
};

