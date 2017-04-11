import React from 'react'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

export const CreatableField = ({ input, label, options, value, meta, multi, clearable }) => {
    const { touched, error, warning } = meta
    return (
        <div className="field">
            {label && <label>{label}</label>}
            <Select.Creatable
                value={value}
                multi={multi}
                clearable={clearable}
                options={options}
                tabSelectsValue={false}
                valueKey="label"
                className="line-input"
                allowCreate={true}
                newOptionCreator={(opt) => {
                    return {
                        label: opt.label,
                        name: opt.label,
                        value: {
                            label: opt.label,
                            name: opt.label,
                        },
                    }
                }}
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

CreatableField.propTypes = {
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
}
