import React from 'react';
import classNames from 'classnames';

interface IButtonStackProps {
    children?: React.ReactNode;
    right?: boolean;
    padded?: boolean;
    className?: string;
}

/**
 * @ngdoc react
 * @name ButtonStack
 * @description Stack of buttons of a Sub Nav bar
 */
export const ButtonStack: React.FC<IButtonStackProps> = ({
    children,
    right = false,
    padded = false,
    className
}) => (
    <div
        className={classNames(
            'subnav__button-stack',
            {
                'subnav__button-stack--right': right,
                'subnav__button-stack--padded': padded,
            },
            className
        )}
    >
        {children}
    </div>
);
