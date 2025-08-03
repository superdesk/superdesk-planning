import React from 'react';

interface IProps {
    expanded?: boolean;
    parentItem: React.ReactNode,
    nestedChildren: React.ReactNode;
    noMarginTop?: boolean;
}

export class NestedItem extends React.PureComponent<IProps> {
    render() {
        return (
            <div data-test-id="has-nested-items">
                {this.props.parentItem}

                {(this.props.expanded ?? false) && (
                    <div style={{paddingInlineStart: 'var(--space--1)'}} data-test-id="nested-items">
                        {this.props.nestedChildren}
                    </div>
                )}
            </div>
        );
    }
}
