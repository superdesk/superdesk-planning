import React from 'react'
import PropTypes from 'prop-types'
import { isBoolean, get } from 'lodash'
import { Toggle } from '../index'
import './style.scss'

export const ToggleField = ({ input, label, readOnly, defaultValue=false, meta: { touched, error, warning } }) => {
    input = {
        ...input,
        value: isBoolean(get(input, 'value')) ? get(input, 'value') : defaultValue,
    }

    return (
        <label>
            <Toggle
                {...input}
                onChange={
                    () => {
                        input.onChange(!input.value)
                    }
                }
                readOnly={readOnly}/> {label}
            {touched && ((error && <span className="error-block">{error}</span>) ||
                (warning && <span className="help-block">{warning}</span>))}
        </label>
    )
}

ToggleField.propTypes = {
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    meta: PropTypes.object,
    readOnly: PropTypes.bool,
    defaultValue: PropTypes.bool,
}

ToggleField.defaultProps = { defaultValue: false }
