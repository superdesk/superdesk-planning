import React from 'react';
import PropTypes from 'prop-types';

/**
 * @ngdoc react
 * @name Select
 * @description Component to select a list from dropdown
 */
export const Select = ({
    id, field, value, onChange, options, readOnly,
    clearable, autoFocus, onFocus, refNode, placeholder,
}) => (
    <select
        id={id}
        className="sd-line-input__select"
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        name={field}
        disabled={readOnly ? 'disabled' : ''}
        autoFocus={autoFocus}
        ref={refNode}
        onFocus={onFocus}
    >
        {placeholder && (
            <option value="" disabled={true} hidden={true}>{placeholder}</option>
        )}
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
    id: PropTypes.string,
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
    autoFocus: PropTypes.bool,
    refNode: PropTypes.func,
    onFocus: PropTypes.func,
    placeholder: PropTypes.string,
};

Select.defaultProps = {
    readOnly: false,
    clearable: false,
    autoFocus: false,
};
