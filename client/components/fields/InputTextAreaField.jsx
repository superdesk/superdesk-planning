import React from 'react'
import classNames from 'classnames'

export const InputTextAreaField = ({ input, label, readOnly, multiLine, meta: { touched, error, warning } }) => (
    <div className="field">
        {label && <label>{label}</label>}
        <textArea {...input}
            className={classNames({ 'line-input': !multiLine }, { 'disabledInput': readOnly })}
            disabled={readOnly ? 'disabled' : ''}/>
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
}
