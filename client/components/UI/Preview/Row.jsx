import React from 'react';
import PropTypes from 'prop-types';

export const Row = ({label, value, className}) => (
    <div className="form__row">
        <label className="form-label form-label--light">{label}</label>
        <p className={'sd-text__' + className}>{value}</p>
    </div>
);

Row.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    className: PropTypes.string,
};
