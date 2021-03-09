import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

interface IProps {
    collapsed?: boolean; // defaults to true
    expanded?: boolean;
    parentItem: React.ReactNode,
    nestedChildren: React.ReactNodeArray;
    noMarginTop?: boolean;
}

export class NestedItem extends React.PureComponent<IProps> {
    render() {
        return (
            <div
                className={classNames(
                    'sd-list-item-nested',
                    {
                        'sd-list-item-nested--collapsed': this.props.collapsed ?? true,
                        'sd-list-item-nested--expanded': this.props.expanded,
                        'sd-margin-t--0': this.props.noMarginTop,
                    }
                )}
            >
                {this.props.parentItem}
                <div className="sd-list-item-nested__childs sd-shadow--z1">
                    {this.props.nestedChildren}
                </div>
            </div>
        );
    }
}
