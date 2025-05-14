import React from 'react';
import classNames from 'classnames';
import {IconButton} from 'superdesk-ui-framework/react';

interface ITool {
    icon: string;
    onClick: () => void;
    title: string;
}

interface IToolsProps {
    className?: string;
    tools?: Array<ITool>;
    children?: React.ReactNode;
    topTools?: boolean;
}

export const Tools = ({
    className,
    tools = [],
    children,
    topTools = false,
}: IToolsProps) => (
    <div
        className={classNames(
            {
                'side-panel__tools': !topTools,
                'side-panel__top-tools': topTools,
            },
            className
        )}
    >
        {tools.map((tool) => (
            <IconButton
                toolTipFlow="left"
                key={tool.icon}
                icon={tool.icon}
                onClick={tool.onClick}
                ariaValue={tool.title}
            />
        ))}
        {children}
    </div>
);
