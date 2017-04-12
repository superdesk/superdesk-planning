import React from 'react'

export const InputField = ({ input, label, type, autoFocus, meta: { touched, error, warning } }) => (
    <div className="field">
        {label && <label>{label}</label>}
        <input {...input} type={type} autoFocus={autoFocus} className="line-input"/>
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
}
