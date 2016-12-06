import { AddGeoSuggestInput } from './index'
import React from 'react'

export const InputField = ({ input, label, type, meta: { touched, error, warning } }) => (
    <div className="field">
        {label && <label>{label}</label>}
        <input {...input} type={type} className="line-input"/>
        {touched && ((error && <span className="help-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))}
    </div>
)

export const GeoSuggestInput = ({ input, label, meta: { touched, error, warning } }) => (
    <div className="field">
        {label && <label>{label}</label>}
        <AddGeoSuggestInput
            onChange={input.onChange}
            initialValue={input.value || {}}/>
        {touched && ((error && <span className="help-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))}
    </div>
)
