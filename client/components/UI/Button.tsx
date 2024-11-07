import React from 'react';
import classNames from 'classnames';

import {KEYCODES} from './constants';
import {onEventCapture} from './utils';


interface IButtonProps {
    id?: string;
    className?: string;
    onClick: (...args: any) => any;
    icon?: string;
    title?: string;
    text?: string;
    disabled?: boolean;
    textOnly?: boolean;
    hollow?: boolean;
    iconOnly?: boolean;
    expanded?: boolean;
    color?: 'primary' | 'success' | 'warning' | 'alert' | 'highlight' | 'sd-green' | 'ui-dark' | 'default';
    size?: 'small' | 'large';
    tabIndex?: number;
    enterKeyIsClick?: boolean;
    autoFocus?: boolean;
    onKeyDown?: (e: React.KeyboardEvent) => any;
    refNode?: (...args: any) => any;
    iconOnlyCircle?: boolean;
    children?: React.ReactNode;
    pullRight?: boolean;
    empty?: boolean;
}

const Button = ({
    disabled = false,
    textOnly = false,
    hollow = false,
    expanded = false,
    enterKeyIsClick = false,
    autoFocus = false,
    iconOnlyCircle = false,
    pullRight = false,
    empty = false,
    className,
    onClick,
    icon,
    id,
    title,
    text,
    color,
    size,
    iconOnly,
    tabIndex,
    refNode,
    onKeyDown,
    children,
    ...props
}: IButtonProps) => {
    const handeKeyDown = (event) => {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            onClick();
            return;
        }

        if (onKeyDown) {
            onKeyDown(event);
        }
    };

    return (
        <button
            id={id}
            className={classNames(
                color ? `btn--${color}` : null,
                size ? `btn--${size}` : null,
                {
                    btn: !empty,
                    'btn--disabled': disabled,
                    'btn--text-only': textOnly,
                    'btn--hollow': hollow,
                    'btn--expanded': expanded,
                    'btn--icon-only': iconOnly,
                    'btn--icon-only-circle': iconOnlyCircle,
                    'pull-right': pullRight,
                },
                className
            )}
            onClick={disabled ? null : onClick || null}
            disabled={disabled}
            title={title}
            tabIndex={tabIndex}
            onKeyDown={enterKeyIsClick ? handeKeyDown : onKeyDown}
            autoFocus={autoFocus}
            ref={refNode}
            {...props}
        >
            {icon && <i className={icon} />}
            {!iconOnly && text}
            {children}
        </button>
    );
};

export default Button;
