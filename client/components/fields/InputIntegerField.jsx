import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export class InputIntegerField extends React.Component {
    focus() {
        this.refs.number.focus();
    }

    render() {
        const {
            input,
            label,
            readOnly,
            labelLeft,
            required,
            meta: {touched, error, warning},
        } = this.props;

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

        return (
            <div className={divClass}>
                {label &&
                    <label className="sd-line-input__label">
                        {label}
                    </label>
                }

                <input
                    {...input}
                    type="number"
                    min="1"
                    ref="number"
                    className={inputClass}
                    disabled={readOnly ? 'disabled' : ''} />

                {touched && (
                    (error && <div className="sd-line-input__message">{error}</div>) ||
                    (warning && <div className="sd-line-input__message">{warning}</div>)
                )}
            </div>
        );
    }
}

InputIntegerField.propTypes = {
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    meta: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    labelLeft: PropTypes.bool,
    required: PropTypes.bool,
};

InputIntegerField.defaultProps = {
    labelLeft: false,
    required: false,
};
