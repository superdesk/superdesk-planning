import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Button = ({className, onClick, icon, title, children}) => (
    <button
        className={classNames(
            'navbtn',
            className
        )}
        onClick={onClick || null}
        title={title}
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
};