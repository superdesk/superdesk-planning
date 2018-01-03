import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Select = ({field, value, onChange, options, readOnly}) => (
    <select
        className={classNames(
            'sd-line-input__select'
        )}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        name={field}
        disabled={readOnly}
    >
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
};

Select.defaultProps = {readOnly: false};
