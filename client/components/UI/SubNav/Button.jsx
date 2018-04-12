import React from 'react';
import PropTypes from 'prop-types';

import {ButtonStack} from './ButtonStack';

export const Button = ({children, className, right, buttonClassName, onClick, padded}) => (
    <ButtonStack
        right={right}
        padded={padded}
        className={className}
    >
        <button className={buttonClassName} onClick={onClick}>
            {children}
        </button>
    </ButtonStack>
);

Button.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    right: PropTypes.bool,
    buttonClassName: PropTypes.string,
    onClick: PropTypes.func,
    padded: PropTypes.bool,
};

Button.defaultProps = {
    right: false,
    padded: false,
};
