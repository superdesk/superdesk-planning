import * as React from 'react';

interface IProps {
    field: string;
    type: string; // defaults to 'text'
    value: string | number;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
    testId?: string;
    onChange(field: string, value: string | number): void;
    onBlur?(event: React.FocusEvent<HTMLInputElement>): void;
    onClick?(event: React.MouseEvent<HTMLInputElement>): void;
    onKeyDown?(event: React.KeyboardEvent<HTMLInputElement>): void;
    refNode?(node: HTMLElement): void;
    onFocus?(event: React.FocusEvent<HTMLInputElement>): void;
}

export class Input extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.onInputChanged = this.onInputChanged.bind(this);
    }

    onInputChanged(event) {
        let data = event.target.value;

        if (this.props.type === 'file') {
            data = event.target.files;
        }

        this.props.onChange(this.props.field, data);
    }

    render() {
        const {
            field,
            type = 'text',
            value,
            onChange,
            placeholder,
            onBlur,
            onClick,
            onFocus,
            readOnly,
            refNode,
            className,
            testId,
            ...props
        } = this.props;

        return (
            <input
                className={className ?
                    `sd-line-input__input ${className}` :
                    'sd-line-input__input'
                }
                type={type}
                name={field}
                value={value}
                placeholder={placeholder}
                onChange={this.onInputChanged}
                onBlur={onBlur}
                onClick={onClick}
                onFocus={onFocus}
                disabled={readOnly}
                data-test-id={testId}
                ref={refNode}
                {...props}
            />
        );
    }
}
