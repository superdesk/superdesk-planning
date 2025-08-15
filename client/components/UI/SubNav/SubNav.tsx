import React from 'react';
import classNames from 'classnames';

interface ISubNavProps {
    children?: React.ReactNode;
    className?: string;
    darkBlue?: boolean;
    darker?: boolean;
    responsive?: boolean;
    compact?: boolean;
    testId?: string;
    zIndex?: number;
}

/**
 * @ngdoc react
 * @name Subnav
 * @description Main Sub Nav component
 */
export const SubNav: React.FC<ISubNavProps> = ({
    children,
    className,
    darkBlue = false,
    darker = false,
    responsive = false,
    compact = false,
    testId,
    zIndex
}) => (
    <div
        className={classNames(
            'subnav',
            {
                'subnav--dark-blue-grey': darkBlue,
                'subnav--darker': darker,
                'subnav--responsive': responsive,
                'compact--level-1': compact,
            },
            className
        )}
        data-test-id={testId}
        style={zIndex ? {zIndex} : undefined}
    >
        {children}
    </div>
);
