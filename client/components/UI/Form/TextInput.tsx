import React from 'react';
import PropTypes from 'prop-types';
import {LineInput, Label, Input} from './';
import {LineInputProps, LineInputDefaultProps} from './LineInput';
import {get, uniqueId} from 'lodash';

/**
 * @ngdoc react
 * @name TextInput
 * @description Component to recieve text input in
 */
export const TextInput = ({
    field,
    label,
    value,
    onChange,
    maxLength,
    invalid,
    readOnly,
    type,
    inputClassName,
    refNode,
    autoFocus,
    onFocus,
    testId,
    ...props
}) => {
    const inputId = uniqueId('input-');

    return (
        <LineInput {...props} invalid={invalid} readOnly={readOnly}>
            <Label htmlFor={inputId} text={label} />
            <Input
                field={field}
                value={value}
                onChange={onChange}
                type={type}
                readOnly={readOnly}
                refNode={refNode}
                className={inputClassName}
                autoFocus={autoFocus}
                onFocus={onFocus}
                testId={testId}
                id={inputId}
            />

            {maxLength > 0 &&
            <div className="sd-line-input__char-count">{get(value, 'length', 0)}/{maxLength}</div>
            }
        </LineInput>
    );
};

TextInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    onChange: PropTypes.func,
    maxLength: PropTypes.number,
    type: PropTypes.string,
    refNode: PropTypes.func,
    inputClassName: PropTypes.string,
    autoFocus: PropTypes.bool,
    testId: PropTypes.string,
    ...LineInputProps,
};

TextInput.defaultProps = {
    maxLength: 0,
    type: 'text',
    value: '',
    ...LineInputDefaultProps,
};
