import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

interface IProps {
    children?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}
/**
 * @ngdoc react
 * @name Content
 * @description Component to hold contents of a popup
 */
const Content = ({children, className, noPadding}: IProps) => (
    <div
        className={classNames(
            'popup__menu-content',
            {'popup__menu-content--no-padding': noPadding},
            className
        )}
    >
        {children}
    </div>
);

export default Content;
