import React from 'react';
import classNames from 'classnames';

interface IProps {
    className?: string;
    children: React.ReactNode;
}

/**
 * @ngdoc react
 * @name Footer
 * @description Footer Component of a side panel
 */
export const Footer: React.FC<IProps> = ({children, className}) => (
    <div
        className={classNames(
            'side-panel__footer',
            className
        )}
    >
        {children}
    </div>
);
