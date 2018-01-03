import React from 'react';
import PropTypes from 'prop-types';
import {LineInput, Label, Input} from './';
import {LineInputProps, LineInputDefaultProps} from './LineInput';
import {get} from 'lodash';

export const TextInput = ({
    field,
    label,
    value,
    onChange,
    maxChars,
    invalid,
    readOnly,
    type,
    refNode,
    ...props
}) => (
    <LineInput {...props} invalid={invalid} readOnly={readOnly}>
        <Label text={label}/>
        <Input
            field={field}
            value={value}
            onChange={onChange}
            type={type}
            readOnly={readOnly}
            refNode={refNode}
        />

        {maxChars > 0 &&
            <div className="sd-line-input__char-count">{get(value, 'length', 0)}/{maxChars}</div>
        }
    </LineInput>
);

TextInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    onChange: PropTypes.func.isRequired,
    maxChars: PropTypes.number,
    type: PropTypes.string,
    refNode: PropTypes.func,
    ...LineInputProps,
};

TextInput.defaultProps = {
    maxChars: 0,
    type: 'text',
    value: '',
    ...LineInputDefaultProps,
};
