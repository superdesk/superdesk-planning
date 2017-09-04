import { AddGeoLookupInput } from '../index'
import classNames from 'classnames'
import React from 'react'
import { get } from 'lodash'

export const GeoLookupInput = ({ input, label, readOnly, meta: { touched, error, warning } }) => {

    const showMessage = touched && (error || warning)
    const divClass = classNames(
        'sd-line-input',
        { 'sd-line-input--invalid': showMessage },
        { 'sd-line-input--no-margin': !showMessage }
    )

    const type = input.value && (input.value.type || get(input.value.nominatim, 'type') || null)
    return (<div className={divClass}>
        {label && <label className="sd-line-input__label">{label}</label>}

        {type && <span className='label addgeolookup__suggestItemLabel'>{type.replace('_', ' ')}</span>}
        <AddGeoLookupInput
            onChange={input.onChange}
            initialValue={input.value || {}}
            readOnly={readOnly}/>
        {touched && ((error && <span className="error-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))}
    </div>)
}
GeoLookupInput.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
    readOnly: React.PropTypes.bool,
}
