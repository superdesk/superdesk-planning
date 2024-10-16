import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

interface IProps {
    children: JSX.Element | Array<JSX.Element>;
    className?: string;
    right?: boolean;
}
/**
 * @ngdoc react
 * @name StretchBar
 * @description Stretch Bar of a Sub Nav bar
 */
export const StretchBar = ({children, className, right = false}: IProps) => (
    <div
        className={classNames(
            'subnav__stretch-bar',
            {'subnav__stretch-bar--right': right},
            className
        )}
    >
        {children}
    </div>
);
