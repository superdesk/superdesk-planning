import { AddGeoSuggestInput } from '../index'
import React from 'react'

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
GeoSuggestInput.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
}
