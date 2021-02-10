import React from 'react';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Dropdown
 * @description Main dropdown component
 */

interface IProps {
    className?: string;
    isOpen?: boolean;
    alignRight?: boolean;
    dropUp?: boolean;
}

export class Dropdown extends React.PureComponent<IProps> {
    render() {
        return (
            <div
                className={classNames(
                    'dropdown',
                    {
                        'dropdown--align-right': this.props.alignRight,
                        open: this.props.isOpen,
                    },
                    {'dropdown--dropup': this.props.dropUp},
                    this.props.className
                )}
            >
                {this.props.children}
            </div>
        );
    }
}

