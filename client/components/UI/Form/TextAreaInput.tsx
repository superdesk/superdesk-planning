import React from 'react';
import PropTypes from 'prop-types';
import {get, uniqueId} from 'lodash';

import {LineInput, Label, TextArea} from './';

import './style.scss';

/**
 * @ngdoc react
 * @name TextAreaInput
 * @description Component to multi-line text input with Field Label
 */
export const TextAreaInput = ({
    field,
    value,
    label,
    onChange,
    autoHeight,
    autoHeightTimeout,
    nativeOnChange,
    placeholder,
    readOnly,
    maxLength,
    onFocus,
    initialFocus,
    refNode,
    rows,
    labelIcon,
    ...props
}) => {
    const textareaId = uniqueId('textarea-');

    return (
        <LineInput {...props} readOnly={readOnly}>
            <Label htmlFor={textareaId} text={label} icon={labelIcon} />
            <TextArea
                field={field}
                value={value}
                onChange={onChange}
                autoHeight={autoHeight}
                autoHeightTimeout={autoHeightTimeout}
                nativeOnChange={nativeOnChange}
                placeholder={placeholder}
                readOnly={readOnly}
                onFocus={onFocus}
                initialFocus={initialFocus}
                refNode={refNode}
                rows={rows}
                id={textareaId}
            />

            {maxLength > 0 &&
            <div className="sd-line-input__char-count">{get(value, 'length', 0)}/{maxLength}</div>
            }
        </LineInput>
    );
};

TextAreaInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    maxLength: PropTypes.number,

    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noLabel: PropTypes.bool,
    noMargin: PropTypes.bool,
    autoHeight: PropTypes.bool,
    autoHeightTimeout: PropTypes.number,
    nativeOnChange: PropTypes.bool,
    placeholder: PropTypes.string,
    onFocus: PropTypes.func,
    initialFocus: PropTypes.bool,
    refNode: PropTypes.func,
    rows: PropTypes.number,
    labelIcon: PropTypes.string,
};

TextAreaInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    autoHeight: true,
    autoHeightTimeout: 50,
    nativeOnChange: false,
    maxLength: 0,
    initialFocus: false,
    rows: 1,
};
