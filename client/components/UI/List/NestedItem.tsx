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
            <div>
                {this.props.parentItem}

                {(this.props.expanded ?? false) && (
                    <div style={{paddingInlineStart: 'var(--space--1)'}}>
                        {this.props.nestedChildren}
                    </div>
                )}
            </div>
        );
    }
}
