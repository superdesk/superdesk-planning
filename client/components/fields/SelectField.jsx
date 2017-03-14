import React from 'react'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

export const SelectField = ({ input, label, options, value, meta, multi }) => {
    const { touched, error, warning } = meta
    return (
        <div className="field">
            {label && <label>{label}</label>}
            <Select
                value={value}
                multi={multi}
                options={options}
                onChange={(opts) => {
                    input.onChange((Array.isArray(opts)) ? opts.map((opt) => (opt.value)) : opts.value)
                }}
                className="line-input"
            />
            {touched && ((error && <span className="help-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div>
    )
}

SelectField.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
    multi: React.PropTypes.bool.isRequired,
    options: React.PropTypes.arrayOf(React.PropTypes.shape({
        label: React.PropTypes.string,
        value: React.PropTypes.object,
    })).isRequired,
    value: React.PropTypes.oneOfType([
        React.PropTypes.array,
        React.PropTypes.shape(undefined),
        React.PropTypes.shape({
            label: React.PropTypes.string,
            value: React.PropTypes.object,
        })
    ]),
}
