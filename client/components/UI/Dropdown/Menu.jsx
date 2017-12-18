import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Menu = ({children, className, isOpen, alignRight}) => (
    !isOpen ? null :
        <ul
            className={classNames(
                'dropdown__menu',
                'scrollable',
                {'dropdown--align-right': alignRight},
                className
            )}
        >
            {children}
        </ul>
);

Menu.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    isOpen: PropTypes.bool,
    alignRight: PropTypes.bool
};

Menu.defaultProps = {
    isOpen: false,
    alignRight: false
};
