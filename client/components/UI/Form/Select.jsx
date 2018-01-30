import React from 'react';
import PropTypes from 'prop-types';

export const Select = ({field, value, onChange, options, readOnly, clearable}) => (
    <select
        className="sd-line-input__select"
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        name={field}
        disabled={readOnly}
    >
        {clearable && (
            <option value="" />
        )}
        {options.map((opt) => (
            <option
                key={opt.key}
                value={opt.key}
            >
                {opt.label}
            </option>
        ))}
    </select>
);

Select.propTypes = {
    field: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        label: PropTypes.string,
    })),
    readOnly: PropTypes.bool,
    clearable: PropTypes.bool,
};

Select.defaultProps = {
    readOnly: false,
    clearable: false,
};
