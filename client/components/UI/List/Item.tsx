import React from 'react';
// import PropTypes from 'prop-types';
import classNames from 'classnames';

interface IProps {
    noBg?: boolean;
    noHover?: boolean;
    shadow?: number;
    activated?: boolean;
    className?: string;
    margin?: boolean;
    disabled?: boolean;
    refNode?: any;

    onClick?(): void;
    onMouseEnter?(): void;
    onMouseLeave?(): void;
    onMouseDown?(event: React.MouseEvent<HTMLDivElement>): void;
    onMouseUp?(event: React.MouseEvent<HTMLDivElement>): void;
    onFocus?(event: React.FocusEvent<HTMLDivElement>): void;
    onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>): void;
}

export class Item extends React.PureComponent<IProps> {
    render() {
        const {
            children,
            noBg,
            noHover,
            shadow,
            activated,
            className,
            onClick,
            margin,
            disabled,
            onMouseEnter,
            onMouseLeave,
            onFocus,
            onKeyDown,
            onMouseDown,
            onMouseUp,
            refNode,
        } = this.props;

        return (
            <li
                className={classNames(
                    className,
                    'sd-list-item',
                    {
                        'sd-list-item--no-bg': noBg,
                        'sd-list-item--no-hover': noHover,
                        'sd-list-item--margin': margin,
                        'sd-list-item--activated': activated,
                        [`sd-shadow--z${shadow}`]: shadow,
                        'sd-list-item--disabled': disabled,
                    }
                )}
                onClick={onClick}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                ref={refNode}
                tabIndex={0}
            >
                {children}
            </li>
        );
    }
}
