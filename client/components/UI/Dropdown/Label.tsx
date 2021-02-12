import React from 'react';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Label
 * @description Label styling for dropdown optins
 */

interface IProps {
    className?: string;
}

export class Label extends React.PureComponent<IProps> {
    render() {
        return (
            <li
                className={classNames(
                    'dropdown__menu-label',
                    this.props.className
                )}
            >
                {this.props.children}
            </li>
        );
    }
}
