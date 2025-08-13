import React from 'react';
import classNames from 'classnames';

interface IBoxProps {
    children?: React.ReactNode;
    verticalScroll?: boolean;
}

/**
 * @ngdoc react
 * @name Box
 * @description UI component with column-box styling
 */

export const Box: React.FC<IBoxProps> = ({children, verticalScroll}) => (
    <div
        className={classNames('sd-column-box--2',
            {'sd-column-box--vertical-scroll': verticalScroll})}
    >
        {children}
    </div>
);
