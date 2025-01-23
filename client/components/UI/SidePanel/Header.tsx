import React from 'react';
import classNames from 'classnames';

interface IProps {
    children?: React.ReactNode;
    className?: string;
    darkBlue?: boolean;
    darker?: boolean;
}

export const Header: React.FC<IProps> = ({children, className, darkBlue = false, darker = false}) => (
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
