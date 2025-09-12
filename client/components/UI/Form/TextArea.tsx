import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {debounce} from 'lodash';

import './style.scss';

interface ITextAreaProps {
    field?: string;
    value?: string;
    onChange?: (...args: any) => void;
    autoHeight?: boolean;
    autoHeightTimeout?: number;
    nativeOnChange?: boolean;
    placeholder?: string;
    readOnly?: boolean;
    paddingRight60?: boolean;
    multiLine?: boolean;
    className?: string;
    initialFocus?: boolean;
    actualFieldId?: string;
    refNode?: (node: HTMLTextAreaElement | null) => void;
    rows?: number;
    [key: string]: any;
}

/**
 * @ngdoc react
 * @name TextArea
 * @description Auto-resizing component to multi-line text input
 */
export class TextArea extends React.Component<ITextAreaProps> {
    dom: { input: HTMLTextAreaElement | null };
    delayedResize: ((value?: string) => void) | null;

    constructor(props: ITextAreaProps) {
        super(props);
        this.dom = {input: null};
        this.autoResize = this.autoResize.bind(this);
        this.onChange = this.onChange.bind(this);
        this.delayedResize = null;
    }

    componentDidMount() {
        this.delayedResize = debounce(this.autoResize, this.props.autoHeightTimeout || 50);
        if (this.props.autoHeight ?? true) {
            this.delayedResize();
        }
        if (this.props.initialFocus) {
            this.dom.input?.focus();
        }
    }

    componentWillReceiveProps(nextProps: ITextAreaProps) {
        if ((this.props.autoHeight ?? true) && nextProps.value !== this.props.value) {
            this.delayedResize?.(nextProps.value);
        }
    }

    autoResize(value: string | null = null) {
        if (this.dom.input) {
            if (value !== null) {
                this.dom.input.value = value;
            }

            // This is required so that when the height is reduced, the scrollHeight
            // is recalculated based on the new height, otherwise it will not
            // shrink the height back down
            this.dom.input.style.height = '5px';

            // Now set the height to the scrollHeight value to display the entire
            // text content
            this.dom.input.style.height = `${this.dom.input.scrollHeight}px`;
        }
    }

    onChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        const {nativeOnChange, onChange, field, autoHeight = true, multiLine = true} = this.props;

        if (nativeOnChange && typeof onChange === 'function') {
            onChange(event);
        } else if (onChange && field) {
            onChange(
                field,
                multiLine ? event.target.value : event.target.value.replace('\n', ''),
                this.props.actualFieldId,
            );
        }

        if (autoHeight) {
            this.delayedResize?.();
        }
    }

    render() {
        const {
            field,
            value,
            autoHeight = true,
            readOnly,
            placeholder,
            paddingRight60,
            className,
            refNode,
            rows,

            // Remove these variables from the props variable
            // So they are not passed down to the textarea dom node
            // eslint-disable-next-line no-unused-vars
            onChange,
            autoHeightTimeout,
            nativeOnChange,
            multiLine = true,
            initialFocus,

            ...props
        } = this.props;

        return (
            <textarea
                ref={(node) => {
                    this.dom.input = node;
                    if (refNode) {
                        refNode(node);
                    }
                }}
                className={classNames(
                    'sd-line-input__input',
                    {
                        'sd-line-input__input--auto-height': autoHeight,
                        'sd-line-input__input--padding-right-60': paddingRight60,
                        'sd-line-input__input--unset-height': rows !== 1,
                    },
                    className
                )}
                value={value}
                name={field}
                disabled={readOnly}
                placeholder={readOnly ? '' : placeholder}
                {...props}
                onChange={readOnly ? null : this.onChange}
                rows={rows}
            />
        );
    }
}
