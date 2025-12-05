import React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    first?: boolean;
}
/**
 * @ngdoc react
 * @name Content
 * @description Contents of a slide-in panel
 */
export const Content = ({children, first = true}: IProps) => (
    <div className="sd-slide-in-panel__content">
        <div
            className={classNames('sd-slide-in-panel__content-block',
                {'sd-slide-in-panel__content-block--first': first})}
        >
            {children}
        </div>
    </div>
);
