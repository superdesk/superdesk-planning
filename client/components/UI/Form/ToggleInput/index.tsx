import React from 'react';
import {LineInput, Label} from '../';
import {ILineInputProps} from '../LineInput';
import {Toggle} from '../../';

import './style.scss';


interface IProps extends ILineInputProps {
    field: string,
    label?: string;
    value?: boolean;
    onChange: (...args: any) => void;
    className?: string;
    labelLeftAuto?: boolean;
    title?: string;
    onFocus: () => void;
}

export const ToggleInput = ({field, label, value, onChange, readOnly, className, labelLeftAuto,
    onFocus, title, ...props}: IProps) => (
    <LineInput {...props} readOnly={readOnly} labelLeftAuto={labelLeftAuto} className="sd-line-input__toggle">
        <Label text={label} />
        <Toggle
            field={field}
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            readOnly={readOnly}
            className={className}
            onFocus={onFocus}
            title={title}
        />
    </LineInput>
);

