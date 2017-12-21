import React from 'react';
import PropTypes from 'prop-types';

export const Row = ({label, value, className, children}) => (
    <div className="form__row">
        {label && <label className="form-label form-label--light">{label}</label>}
        {value && <p className={'sd-text__' + className}>{value}</p>}
        {children}
    </div>
);

Row.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
};
