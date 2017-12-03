import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './style.scss';

export const InputField = ({
    input,
    label,
    type,
    autoFocus,
    readOnly,
    required,
    labelLeft,
    meta: {touched, error, warning},
}) => {
    const showMessage = touched && (error || warning);
    const divClass = classNames(
        'sd-line-input',
        {'sd-line-input--label-left': labelLeft},
        {'sd-line-input--invalid': showMessage},
        {'sd-line-input--no-margin': !showMessage},
        {'sd-line-input--required': required}
    );

    const inputClass = classNames(
        'sd-line-input__input',
        {'sd-line-input--disabled': readOnly}
    );

    return <div className={divClass}>
        {label &&
            <label className="sd-line-input__label" htmlFor={input.name}>
                {label}
            </label>
        }
        <input
            {...input}
            type={type}
            autoFocus={autoFocus}
            className={inputClass}
            disabled={readOnly ? 'disabled' : ''} />

        {touched && (
            (error && <div className="sd-line-input__message">{error}</div>) ||
            (warning && <div className="sd-line-input__message">{warning}</div>)
        )}
    </div>;
};

InputField.propTypes = {
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    type: PropTypes.string.isRequired,
    meta: PropTypes.object.isRequired,
    autoFocus: PropTypes.bool,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    labelLeft: PropTypes.bool,
};

InputField.defaultProps = {
    required: false,
    labelLeft: true,
    meta: {},
};
