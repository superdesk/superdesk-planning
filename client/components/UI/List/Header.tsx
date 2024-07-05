import React from 'react';
import classNames from 'classnames';

interface IProps {
    title?: string;
    id?: string;
    marginTop?: boolean;
    marginBottom?: boolean;
    children?: React.ReactNode;
}
/**
 * @ngdoc react
 * @name Header
 * @description Header Component of a list
 */
export const Header = ({children, title, marginTop, marginBottom, id}: IProps) => (
    <div
        className={classNames('sd-list-header',
            {'sd-list-header--m-top': marginTop},
            {'sd-list-header--m-bottom': marginBottom})}
        id={id}
    >
        {title && <span className="sd-list-header__name">{title}</span>}
        {children}
    </div>
);
