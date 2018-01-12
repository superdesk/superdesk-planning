import React from 'react';
import PropTypes from 'prop-types';

import {LineInput, Label} from '../';
import {LineInputProps, LineInputDefaultProps} from '../LineInput';
import {Toggle} from '../../';

import './style.scss';

export const ToggleInput = ({field, label, value, onChange, readOnly, ...props}) => (
    <LineInput {...props} readOnly={readOnly} className="sd-line-input__toggle">
        <Label text={label}/>
        <Toggle
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            readOnly={readOnly}
        />
    </LineInput>
);

ToggleInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    ...LineInputProps,
};

ToggleInput.defaultProps = {
    value: false,
    ...LineInputDefaultProps,
};
