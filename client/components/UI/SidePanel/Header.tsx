import React from 'react';
import classNames from 'classnames';

interface IHeaderProps {
    children?: React.ReactNode;
    className?: string;
    darkBlue?: boolean;
    darker?: boolean;
}

/**
 * @ngdoc react
 * @name Header
 * @description Header Component of a side panel
 */
export const Header = ({
    children,
    className,
    darkBlue = false,
    darker = false,
}: IHeaderProps) => (
    <div
        className={classNames(
            'side-panel__header',
            {
                'subnav--dark-blue-grey': darkBlue,
                'subnav--darker': darker,
            },
            className
        )}
    >
        <div className="side-panel__header-inner">
            {children}
        </div>
    </div>
);
