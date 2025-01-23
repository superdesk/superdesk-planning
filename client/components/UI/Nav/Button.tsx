import React from 'react';
import classNames from 'classnames';
import './style.scss';

interface IProps {
    className?: string;
    onClick?: () => void;
    icon?: string;
    tooltip?: string;
    tooltipDirection?: 'top' | 'down' | 'left' | 'right';
    children?: React.ReactNode;
    dropdown?: boolean;
    textWithIcon?: boolean;
    left?: boolean;
    darker?: boolean;
    active?: boolean;
    navbtn?: boolean;
    noBorderNoPadding?: boolean;
    disabled?: boolean;
}

export const Button: React.FC<IProps> = ({
    className,
    onClick,
    icon,
    tooltip,
    tooltipDirection = 'top',
    children,
    dropdown = false,
    textWithIcon = false,
    left = false,
    darker = false,
    active = false,
    navbtn = true,
    noBorderNoPadding,
    disabled = false,
    ...props
}) => (
    <button
        className={classNames(
            {
                navbtn: navbtn,
                'navbtn--left': left,
                'navbtn--darker': darker,
                'navbtn--active': active,
                'navbtn--text-with-icon': textWithIcon,
                'dropdown-toggle': dropdown,
                dropdown__toggle: dropdown,
                'navbtn--no-padding-no-border': noBorderNoPadding,

            },
            className
        )}
        onClick={onClick || null}
        data-sd-tooltip={tooltip}
        data-flow={tooltipDirection}
        disabled={disabled}
        {...props}
    >
        {icon && <i className={icon} />}
        {children}
    </button>
);
