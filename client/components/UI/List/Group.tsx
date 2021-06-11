import React from 'react';
// import PropTypes from 'prop-types';
import classNames from 'classnames';

interface IProps {
    className?: string;
    spaceBetween?: boolean;
    verticalScroll?: boolean;
    style?: React.CSSProperties;
    refNode?: any;
    shadow?: number;
    testId?: string;

    onScroll?(event: React.UIEvent): void;
    onKeyDown?(event: React.KeyboardEvent<HTMLUListElement>): void;
}

export class Group extends React.PureComponent<IProps> {
    render() {
        const {
            className,
            children,
            spaceBetween,
            verticalScroll,
            style,
            onScroll,
            refNode,
            shadow,
            testId,
            onKeyDown,
        } = this.props;

        return (
            <ul
                data-test-id={testId}
                className={classNames(
                    className,
                    'sd-list-item-group',
                    shadow ? `sd-shadow--z${shadow}` : null,
                    {
                        'sd-list-item-group--space-between-items': spaceBetween,
                        'sd-list-item-group--vertical-scroll': verticalScroll,
                    }
                )}
                style={style}
                onScroll={onScroll}
                ref={refNode}
                tabIndex={-1}
                onKeyDown={onKeyDown}
            >
                {children}
            </ul>
        );
    }
}
