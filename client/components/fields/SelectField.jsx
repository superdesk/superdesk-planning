import React from 'react'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

export const SelectField = ({ input, label, options, value, meta, multi, clearable, readOnly }) => {
    const { touched, error, warning } = meta
    return (
        <div className="field">
            {label && <label>{label}</label>}
            <Select
                value={value}
                multi={multi}
                clearable={clearable}
                options={options}
                tabSelectsValue={false}
                valueKey="label"
                className="line-input"
                disabled={readOnly}
                onChange={(opts) => {
                    if (Array.isArray(opts)) {
                        input.onChange(opts.map((opt) => (opt.value)))
                    } else {
                        input.onChange(opts && opts.value || null)
                    }
                }}
            />
            {touched && ((error && <span className="error-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div>
    )
}

SelectField.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
    multi: React.PropTypes.bool.isRequired,
    clearable: React.PropTypes.bool,
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
        }),
    ]),
    readOnly: React.PropTypes.bool,
}
