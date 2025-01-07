import React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    noPadding?: boolean;
}

/**
 * Menu Component in a popup
 */
const Menu: React.FunctionComponent<IProps> = ({children, noPadding}) => (
    <div
        className={classNames(
            'popup__menu',
            {'popup__menu--no-padding': noPadding}
        )}
    >
        {children}
    </div>
);

export default Menu;
