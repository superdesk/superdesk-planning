import React from 'react'

export const InputTextAreaField = ({ input, label, meta: { touched, error, warning } }) => (
    <div className="field">
        {label && <label>{label}</label>}
        <textArea {...input}/>
        {touched && ((error && <span className="help-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))}
    </div>
)
InputTextAreaField.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
}
