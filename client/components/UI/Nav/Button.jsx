import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Button = ({className, onClick, icon, title}) => (
    <div
        className={classNames(
            'navbtn',
            className
        )}
        onClick={onClick || null}
        title={title}
    >
        <i className={icon} />
    </div>
);

Button.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.string.isRequired,
    title: PropTypes.string
};