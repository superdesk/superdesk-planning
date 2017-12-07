import React from 'react';
import PropTypes from 'prop-types';

export const Row = ({label, value, onChange}) => (
    <div className="sd-line-input">
        <label className="sd-line-input__label">{label}</label>
        <input className="sd-line-input__input" type="text" value={value} onChange={onChange} />
    </div>
);

Row.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};
