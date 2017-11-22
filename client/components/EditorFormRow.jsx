import React from 'react';
import PropTypes from 'prop-types';

function EditorFormRow({label, value, onChange}) {
    return (
        <div className="sd-line-input">
            <label className="sd-line-input__label">{label}</label>
            <input className="sd-line-input__input" type="text" value={value} onChange={onChange} />
        </div>
    );
}

EditorFormRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default EditorFormRow;
