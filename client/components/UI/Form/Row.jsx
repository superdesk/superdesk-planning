import React from 'react';
import PropTypes from 'prop-types';

export const Row = ({label, value, onChange, children, showValue}) => (
    <div className="sd-line-input">
        <label className="sd-line-input__label">{label}</label>
        { showValue && <input className="sd-line-input__input" type="text" value={value} onChange={onChange} /> }
        {children}
    </div>
);

Row.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    showValue: PropTypes.bool,
    children: PropTypes.node,
};

Row.defaultProps = {showValue: true};
