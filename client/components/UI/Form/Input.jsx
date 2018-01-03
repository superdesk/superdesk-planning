import React from 'react';
import PropTypes from 'prop-types';

export const Input = ({field, type, value, onChange, placeholder, onBlur, readOnly, refNode}) => {
    const onInputChanged = (e) => {
        let data = e.target.value;

        if (type === 'file') {
            data = e.target.files;
        }

        onChange(field, data);
    };

    return (
        <input
            className="sd-line-input__input"
            type={type}
            name={field}
            value={value}
            placeholder={placeholder}
            onChange={onInputChanged}
            onBlur={onBlur}
            disabled={readOnly}
            ref={refNode}
        />
    );
};

Input.propTypes = {
    field: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    refNode: PropTypes.func,
};

Input.defaultProps = {
    type: 'text',
    readOnly: false,
};
