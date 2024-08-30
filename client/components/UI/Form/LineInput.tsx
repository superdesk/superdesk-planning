import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

interface IProps {
    required?: boolean;
    invalid?: boolean;
    readOnly?: boolean;
    boxed?: boolean;
    isSelect?: boolean;
    noMargin?: boolean;
    noLabel?: boolean;
    withButton?: boolean;
    labelLeft?: boolean;
    labelLeftAuto?: boolean;
    hint?: string;
    message?: string;
    borderBottom?: boolean;
    onClick?: (e: any) => void;
    halfWidth?: boolean;
    children?: React.ReactNode;
    className?: string;
}

/**
 * @ngdoc react
 * @name LineInput
 * @description Component to style input component in a line-input style
 */
export const LineInput = ({
    required,
    invalid,
    readOnly,
    boxed,
    isSelect,
    noMargin,
    noLabel,
    withButton,
    labelLeft,
    labelLeftAuto,
    borderBottom = true,
    halfWidth,
    children,
    hint,
    message,
    className,
    onClick,
}: IProps): JSX.Element => (
    <div
        className={classNames(
            'sd-line-input',
            {
                'sd-line-input--required': required,
                'sd-line-input--invalid': invalid,
                'sd-line-input--disabled': readOnly,
                'sd-line-input--boxed': boxed,
                'sd-line-input--is-select': isSelect,
                'sd-line-input--no-margin': noMargin,
                'sd-line-input--no-label': noLabel,
                'sd-line-input--with-button': withButton,
                'sd-line-input--label-left': labelLeft,
                'sd-line-input--label-left-auto': labelLeftAuto,
                'sd-line-input--no-border-bottom': !borderBottom,
                'sd-line-input--half-width': halfWidth,
            },
            className
        )}
        onClick={onClick ? onClick : undefined}
    >
        {children}
        {hint && <div className="sd-line-input__hint">{hint}</div>}
        {message && <div className="sd-line-input__message">{message}</div>}
    </div>
);
