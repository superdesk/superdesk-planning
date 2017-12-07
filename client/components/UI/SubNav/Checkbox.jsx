import React from 'react';
import PropTypes from 'prop-types';

export const Checkbox = ({label, checked, onClick}) => {
    const className = 'sd-checkbox sd-checkbox--button-style' + (checked ? ' checked' : '');

    return (
        <span className="sd-check__wrapper" onClick={onClick}>
            <span className={className}>
                <label>{label}</label>
            </span>
        </span>
    );
};

Checkbox.propTypes = {
    label: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};
