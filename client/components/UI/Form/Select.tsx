import React from 'react';
import PropTypes from 'prop-types';

interface IProps {
    field: string;
    id?: string;
    value: string | number;
    placeholder?: string;
    readOnly?: boolean;
    clearable?: boolean;
    autoFocus?: boolean;
    options: Array<{
        label: string;
        key: string | number;
    }>;

    onChange(field: string, value: string): void;
    refNode?(node: HTMLElement): void;
    onFocus?(): void;
}

export class Select extends React.PureComponent<IProps> {
    render() {
        const {
            id,
            field,
            value,
            onChange,
            options,
            readOnly,
            clearable,
            autoFocus,
            onFocus,
            refNode,
            placeholder,
        } = this.props;

        return (
            <select
                id={id}
                className="sd-line-input__select"
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
                name={field}
                disabled={readOnly}
                autoFocus={autoFocus}
                ref={refNode}
                onFocus={onFocus}
            >
                {!placeholder ? null : (
                    <option value="" disabled={true} hidden={true}>{placeholder}</option>
                )}
                {!clearable ? null : (
                    <option value="" />
                )}
                {options.map((opt) => (
                    <option
                        key={opt.key}
                        value={opt.key}
                    >
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }
}
