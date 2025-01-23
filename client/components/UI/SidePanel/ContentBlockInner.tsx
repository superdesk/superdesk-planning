import React from 'react';
import classNames from 'classnames';

interface IProps {
    children?: React.ReactNode;
    className?: string;
    right?: boolean;
    grow?: boolean;
}

export const ContentBlockInner: React.FC<IProps> = ({
    children,
    className,
    right,
    grow,
}) => (
    <div
        className={classNames(
            'side-panel__content-block-inner',
            className,
            {
                'side-panel__content-block-inner--right': right,
                'side-panel__content-block-inner--grow': grow,
            }
        )}
    >
        {children}
    </div>
);
