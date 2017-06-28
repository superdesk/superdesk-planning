import React from 'react'
import classNames from 'classnames'
import './style.scss'

export const InputField = ({ input, label, type, autoFocus, readOnly, meta: { touched, error, warning } }) => (
    <div className="field">
        {label && <label>{label}</label>}
        <input {...input} type={type} autoFocus={autoFocus}
            className={classNames('line-input', { 'disabledInput': readOnly })}
            disabled={readOnly ? 'disabled' : ''}/>
        {touched && ((error && <span className="error-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))}
    </div>
)
InputField.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    type: React.PropTypes.string.isRequired,
    meta: React.PropTypes.object.isRequired,
    autoFocus: React.PropTypes.bool,
    readOnly: React.PropTypes.bool,
}
