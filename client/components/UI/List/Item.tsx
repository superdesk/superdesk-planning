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
    draggable?: boolean;
    testId?: string;
    zIndex?: number;
    flexRow?: boolean;

    onClick?(event: React.MouseEvent<HTMLLIElement>): void;
    onDoubleClick?(event: React.MouseEvent<HTMLLIElement>): void;
    onMouseEnter?(): void;
    onMouseLeave?(): void;
    onMouseDown?(event: React.MouseEvent<HTMLLIElement>): void;
    onMouseUp?(event: React.MouseEvent<HTMLLIElement>): void;
    onFocus?(event: React.FocusEvent<HTMLLIElement>): void;
    onKeyDown?(event: React.KeyboardEvent<HTMLLIElement>): void;
    onDragStart?: React.DragEventHandler<HTMLElement>;
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
            onDoubleClick,
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
            draggable,
            onDragStart,
            testId,
        } = this.props;

        let styles: React.CSSProperties = {};

        if (this.props.flexRow) {
            styles.display = 'flex';
            styles.flexDirection = 'row';
            styles.justifyContent = 'center';
        }

        if (this.props.zIndex) {
            styles.zIndex = this.props.zIndex;
        }

        return (
            <li
                data-test-id={testId}
                className={classNames(
                    className,
                    'sd-list-item',
                    {
                        'sd-list-item--no-bg': noBg,
                        'sd-list-item--no-hover': noHover,
                        'sd-list-item--margin': margin,
                        'sd-list-item--selected': activated,
                        [`sd-shadow--z${shadow}`]: shadow,
                        'sd-list-item--disabled': disabled,
                        'sd-list-item--draggable': draggable,
                    }
                )}
                style={styles}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                ref={refNode}
                tabIndex={tabIndex}
                draggable={draggable}
                onDragStart={onDragStart}
            >
                {children}
            </li>
        );
    }
}
