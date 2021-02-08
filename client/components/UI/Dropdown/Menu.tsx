import React from 'react';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Menu
 * @description Menu container of dropdown component
 */

interface IProps {
    className?: string;
    isOpen?: boolean;
    alignRight?: boolean;
    scrollable?: boolean;
}

export class Menu extends React.PureComponent<IProps> {
    render() {
        return this.props.isOpen !== true ? null : (
            <ul
                className={classNames(
                    'dropdown__menu',
                    {
                        'dropdown--align-right': this.props.alignRight,
                        'dropdown__menu--scrollable': this.props.scrollable,
                    },
                    this.props.className
                )}
            >
                {this.props.children}
            </ul>
        );
    }
}
