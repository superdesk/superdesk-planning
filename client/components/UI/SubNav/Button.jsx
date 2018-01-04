import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Button = ({children, className, right, buttonClassName, onClick}) => (
    <div
        className={classNames(
            'subnav__button-stack',
            {'subnav__button-stack--right': right},
            className
        )}
    >
        <button className={buttonClassName} onClick={onClick}>
            {children}
        </button>
    </div>
);

Button.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    right: PropTypes.bool,
    buttonClassName: PropTypes.string,
    onClick: PropTypes.func,
};

Button.defaultProps = {
    right: false
};
