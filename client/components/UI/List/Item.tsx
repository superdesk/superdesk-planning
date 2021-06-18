import React from 'react';
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
    tabIndex?: number;

    onClick?(event: React.MouseEvent<HTMLLIElement>): void;
    onMouseEnter?(): void;
    onMouseLeave?(): void;
    onMouseDown?(event: React.MouseEvent<HTMLLIElement>): void;
    onMouseUp?(event: React.MouseEvent<HTMLLIElement>): void;
    onFocus?(event: React.FocusEvent<HTMLLIElement>): void;
    onKeyDown?(event: React.KeyboardEvent<HTMLLIElement>): void;
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
            tabIndex,
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
                tabIndex={tabIndex}
            >
                {children}
            </li>
        );
    }
}
