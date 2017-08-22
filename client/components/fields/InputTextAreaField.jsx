import React from 'react'
import classNames from 'classnames'
import TextareaAutosize from 'react-textarea-autosize'

export const InputTextAreaField = ({
    input,
    label,
    readOnly,
    multiLine,
    autoFocus,
    meta: {
        touched,
        error,
        warning,
    },
    }) => (
    <div className="field">
        {label && <label>{label}</label>}
        <TextareaAutosize {...input}
            className={classNames({ 'line-input': !multiLine }, { 'disabledInput': readOnly })}
            disabled={readOnly ? 'disabled' : ''}
            autoFocus={autoFocus} />
        {touched && ((error && <span className="error-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))}
    </div>
)

InputTextAreaField.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
    readOnly: React.PropTypes.bool,
    multiLine: React.PropTypes.bool,
    autoFocus: React.PropTypes.bool,
}
