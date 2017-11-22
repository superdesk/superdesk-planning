import React from 'react';
import PropTypes from 'prop-types';

function PreviewFormRow({label, value, className}) {
    return (
        <div className="form__row">
            <label className="form-label form-label--light">{label}</label>
            <p className={'sd-text__' + className}>{value}</p>
        </div>
    );
}

PreviewFormRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default PreviewFormRow;
