import React from 'react';

/**
 * @ngdoc react
 * @name Divider
 * @description Divider to separate options in a dropdown
 */

export class Divider extends React.PureComponent<{}> {
    render() {
        return (
            <li className="dropdown__menu-divider" />
        );
    }
}
