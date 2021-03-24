import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {LineInput, Label, ExpandableTextArea} from './';
import {LineInputProps, LineInputDefaultProps} from './LineInput';

import './style.scss';

export const ExpandableTextAreaInput = ({
    field,
    label,
    labelIcon,
    value,
    onChange,
    maxLength,
    placeholder,
    invalid,
    readOnly,
    refNode,
    nativeOnChange,
    initialFocus,
    ...props
}) => (
    <LineInput {...props} invalid={invalid} readOnly={readOnly}>
        <Label text={label} icon={labelIcon} />
        <ExpandableTextArea
            field={field}
            value={value}
            onChange={onChange}
            nativeOnChange={nativeOnChange}
            placeholder={placeholder}
            readOnly={readOnly}
            initialFocus={initialFocus}
            refNode={refNode}
        />

        {maxLength > 0 && (
            <div className="sd-line-input__char-count">
                {get(value, 'length', 0)}/{maxLength}
            </div>
        )}
    </LineInput>
);

ExpandableTextAreaInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    labelIcon: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    maxLength: PropTypes.string,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    refNode: PropTypes.func,
    nativeOnChange: PropTypes.bool,

    ...LineInputProps,
};

ExpandableTextAreaInput.defaultProps = {
    readOnly: false,
    nativeOnChange: false,
    initialFocus: false,
    maxLength: 0,

    ...LineInputDefaultProps,
};
