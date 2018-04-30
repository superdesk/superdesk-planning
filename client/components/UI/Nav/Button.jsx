import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Button = ({className, onClick, icon, title, children, left, darker, active, ...props}) => (
    <button
        className={classNames(
            'navbtn',
            {
                'navbtn--left': left,
                'navbtn--darker': darker,
                'navbtn--active': active,
            },
            className
        )}
        onClick={onClick || null}
        title={title}
        {...props}
    >
        {icon && <i className={icon} />}
        {children}
    </button>
);

Button.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    left: PropTypes.bool,
    darker: PropTypes.bool,
    active: PropTypes.bool,
};

Button.defaultProps = {
    left: false,
    darker: false,
    active: false,
};