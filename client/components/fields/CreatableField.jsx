import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

export const CreatableField = ({input, label, options, value, meta, multi, clearable}) => {
    const {touched, error, warning} = meta;

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
                newOptionCreator={(opt) => ({
                    label: opt.label,
                    name: opt.label,
                    value: {
                        label: opt.label,
                        name: opt.label,
                    },
                })}
                onChange={(opts) => {
                    if (Array.isArray(opts)) {
                        input.onChange(opts.map((opt) => (opt.value)));
                    } else {
                        input.onChange(opts && opts.value || null);
                    }
                }}
            />
            {touched && ((error && <span className="error-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div>
    );
};

CreatableField.propTypes = {
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    meta: PropTypes.object.isRequired,
    multi: PropTypes.bool.isRequired,
    clearable: PropTypes.bool,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.object,
    })).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.shape(undefined),
        PropTypes.shape({
            label: PropTypes.string,
            value: PropTypes.object,
        }),
    ]),
};
