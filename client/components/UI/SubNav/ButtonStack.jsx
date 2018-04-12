import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const ButtonStack = ({children, right, padded, className}) => (
    <div className={classNames(
        'subnav__button-stack',
        {
            'subnav__button-stack--right': right,
            'subnav__button-stack--padded': padded,
        },
        className
    )}>
        {children}
    </div>
);

ButtonStack.propTypes = {
    children: PropTypes.node,
    right: PropTypes.bool,
    padded: PropTypes.bool,
    className: PropTypes.string,
};

ButtonStack.defaultProps = {
    right: false,
    padded: false,
};
