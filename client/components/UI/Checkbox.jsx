import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const Checkbox = ({label, checked, onClick, type, disabled, labelPosition}) => {
    const spanClass = classNames(
        'sd-checkbox',
        {
            'sd-checkbox--button-style': type === 'button',
            'sd-checkbox--radio': type === 'radio',
            checked: checked,
            'sd-checkbox--disabled': disabled,
        }
    );

    const labelClass = disabled ? 'sd-label--disabled' : '';

    let checkbox;

    if (labelPosition === 'inside') {
        checkbox = (
            <span className="sd-check__wrapper" onClick={!disabled && onClick}>
                <span className={spanClass}>
                    <label className={labelClass}>{label}</label>
                </span>
            </span>
        );
    } else if (labelPosition === 'left') {
        checkbox = (
            <span className="sd-check__wrapper">
                <label className={labelClass}>{label}</label>
                <span className={spanClass} onClick={!disabled && onClick} />
            </span>
        );
    } else {
        checkbox = (
            <span className="sd-check__wrapper">
                <span className={spanClass} onClick={!disabled && onClick} />
                <label className={labelClass}>{label}</label>
            </span>
        );
    }

    return checkbox;
};

Checkbox.propTypes = {
    label: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    type: PropTypes.oneOf(['radio', 'button']),
    disabled: PropTypes.bool,
    labelPosition: PropTypes.oneOf(['left', 'right', 'inside']),
};

Checkbox.defaultProps = {
    type: 'button',
    disabled: false,
    labelPosition: 'inside',
};

export default Checkbox;
