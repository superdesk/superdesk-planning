import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TextareaAutosize from 'react-textarea-autosize';

export const InputTextAreaField = ({
    input,
    label,
    readOnly,
    autoFocus,
    required,
    meta: {
        touched,
        error,
        warning,
    },
}) => {
    const showMessage = touched && (error || warning);
    const divClass = classNames(
        'sd-line-input',
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
            <label className="sd-line-input__label">
                {label}
            </label>
        }
        <TextareaAutosize
            {...input}
            className={inputClass}
            disabled={readOnly ? 'disabled' : ''}
            autoFocus={autoFocus}
        />

        {touched && (
            (error && <div className="sd-line-input__message">{error}</div>) ||
            (warning && <div className="sd-line-input__message">{warning}</div>)
        )}
    </div>;
};

InputTextAreaField.propTypes = {
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    meta: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    autoFocus: PropTypes.bool,
    required: PropTypes.bool,
};

InputTextAreaField.defaultProps = {
    required: false,
    meta: {},
};
