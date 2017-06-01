import { AddGeoLookupInput } from '../index'
import React from 'react'

export const GeoLookupInput = ({ input, label, meta: { touched, error, warning } }) => (
    <div className="field">
        {label && <label>{label}</label>}
        <AddGeoLookupInput
            onChange={input.onChange}
            initialValue={input.value || {}}/>
        {touched && ((error && <span className="error-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))}
    </div>
)
GeoLookupInput.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
}
