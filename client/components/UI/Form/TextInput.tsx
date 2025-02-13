import React from 'react';
import {LineInput, Label, Input} from './';
import {ILineInputProps} from './LineInput';
import {get, uniqueId} from 'lodash';

interface IProps extends ILineInputProps {
    field?: string;
    label?: string;
    value?: string | number;
    onChange?: (...args: any) => void;
    maxLength?: number;
    type?: string;
    refNode?: (node: HTMLInputElement) => void;
    inputClassName?: string;
    autoFocus?: boolean;
    testId?: string;
    onFocus?(event: React.FocusEvent<HTMLInputElement>): void;
}

export const TextInput = ({
    field,
    label,
    value = '',
    onChange,
    maxLength = 0,
    invalid,
    readOnly,
    type = 'text',
    inputClassName,
    refNode,
    autoFocus,
    onFocus,
    testId,
    ...props
}: IProps) => {
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
