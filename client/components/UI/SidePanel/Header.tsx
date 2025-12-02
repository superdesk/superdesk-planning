import React from 'react';
import classNames from 'classnames';

interface IProps {
    children?: React.ReactNode;
    className?: string;
    darkBlue?: boolean;
    darker?: boolean;
    'data-test-id'?: string;
}

export const Header: React.FC<IProps> = ({
    children,
    className,
    darkBlue = false,
    darker = false,
    'data-test-id': testId
}) => (
    <div
        data-test-id={testId}
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
