import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Button = ({className, onClick, icon, title, children}) => (
    <div
        className={classNames(
            'navbtn',
            className
        )}
        onClick={onClick || null}
        title={title}
    >
        {icon && <i className={icon} />}
        {children}
    </div>
);

Button.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
};