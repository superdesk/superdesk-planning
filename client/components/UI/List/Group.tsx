import React from 'react';
import classNames from 'classnames';
import {IAccessibleListBox} from 'components/Main/ListPanel';

interface IProps {
    className?: string;
    spaceBetween?: boolean;
    verticalScroll?: boolean;
    style?: React.CSSProperties;
    refNode?: any;
    shadow?: number;
    testId?: string;
    'aria-labelledby'?: string;
    tabIndex?: number;

    /**
     * Active item index is shared between groups.
     * When focus goes to another group, active index needs to be set accordingly.
     * indexFrom indicates global index of the first item in a given group.
     */
    indexFrom?: number;

    listBoxGroupProps: IAccessibleListBox;

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
            tabIndex,
            indexFrom,
            listBoxGroupProps,
        } = this.props;

        return (
            <ul
                aria-labelledby={this.props['aria-labelledby']}
                data-test-id={testId}
                data-index-from={indexFrom}
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
                onKeyDown={onKeyDown}
                {...(listBoxGroupProps?.containerProps ?? {})}
                tabIndex={listBoxGroupProps?.containerProps?.tabIndex ?? tabIndex}
            >
                {children}
            </ul>
        );
    }
}
