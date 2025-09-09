import React from 'react';
import classNames from 'classnames';

import './style.scss';

interface IMainColumnProps {
    children?: React.ReactNode;
    padded?: boolean;
}

/**
 * @ngdoc react
 * @name MainColumn
 * @description Main panel component of column box
 */
export const MainColumn: React.FC<IMainColumnProps> = ({children, padded}) => (
    <div
        className={classNames(
            'sd-column-box__main-column',
            {'sd-column-box__main-column--padded': padded})}
    >
        {children}
    </div>
);
