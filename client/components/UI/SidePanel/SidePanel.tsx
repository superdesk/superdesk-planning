import React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    shadowRight?: boolean;
    shadowLeft?: boolean;
    transparent?: boolean;
    bg00?: boolean;
    className?: string;
    testId?: string;
}

/**
 * @ngdoc react
 * @name SidePanel
 * @description SidePanel Component used usually for Advanced Search panels
 */
export const SidePanel: React.FC<IProps> = ({
    children,
    shadowRight = false,
    shadowLeft = false,
    transparent = false,
    bg00 = false,
    className = '',
    testId,
}: IProps) => (
    <div
        className={classNames(
            'side-panel',
            {
                'side-panel--shadow-right': shadowRight,
                'side-panel--transparent': transparent,
                'side-panel--shadow-left': shadowLeft,
                'side-panel--bg-00': bg00,
            },
            className
        )}
        data-test-id={testId}
    >
        {children}
    </div>
);
