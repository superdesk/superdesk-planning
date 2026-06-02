import React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    row?: boolean;
    className?: string;
}
/**
 * @ngdoc react
 * @name ActionMenu
 * @description Component to encapsulate three-dot action menu in list a item
 */
export const ActionMenu = ({children, className, row = true}: IProps) => (
    <div
        className={classNames(
            'sd-list-item__action-menu',
            {'sd-list-item__action-menu--direction-row': row},
            className,
        )}
    >
        {children}
    </div>
);
