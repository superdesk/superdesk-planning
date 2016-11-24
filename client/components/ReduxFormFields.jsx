import { AddGeoSuggestInput } from './index'
import React from 'react'

export const InputField = ({ input, label, type, meta: { touched, error, warning } }) => (
    <div>
        {label && <label>{label}</label>}
        <div>
            <input {...input} placeholder={label} type={type}/>
            {touched && ((error && <span className="help-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div>
    </div>
)

export const GeoSuggestInput = ({ input, label, meta: { touched, error, warning } }) => (
    <div>
        {label && <label>{label}</label>}
        <div>
            <AddGeoSuggestInput
                onChange={input.onChange}
                initialValue={input.value || {}}/>
            {touched && ((error && <span className="help-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div>
    </div>
)
