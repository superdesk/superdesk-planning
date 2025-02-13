import React from 'react';
import {get} from 'lodash';
import {LineInput, Label, ExpandableTextArea} from './';
import {ILineInputProps} from './LineInput';
import './style.scss';

interface IProps extends ILineInputProps {
    field: string;
    label?: string;
    labelIcon?: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    maxLength?: number;
    placeholder?: string;
    readOnly?: boolean;
    refNode?: (node: HTMLTextAreaElement) => void;
    nativeOnChange?: boolean;
    initialFocus?: boolean;
}

export const ExpandableTextAreaInput = ({
    field,
    label,
    labelIcon,
    value,
    onChange,
    maxLength = 0,
    placeholder,
    invalid,
    readOnly,
    refNode,
    nativeOnChange,
    initialFocus,
    borderBottom = true,
    ...props
}: IProps) => (
    <LineInput borderBottom={borderBottom} {...props} invalid={invalid} readOnly={readOnly}>
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

