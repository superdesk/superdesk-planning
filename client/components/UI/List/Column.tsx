import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Column
 * @description Column Component of a list item
 */

interface IProps {
    children: Array<JSX.Element> | JSX.Element;
    grow?: boolean;
    border?: boolean;
    noPadding?: boolean;
    hasCheck?: boolean;
    checked?: boolean;
    className?: string;
}

export const Column = ({
    children,
    grow = false,
    border = true,
    noPadding = false,
    hasCheck = false,
    checked,
    className,
}: IProps) => (
    <div
        className={classNames(
            'sd-list-item__column',
            {
                'sd-list-item__column--grow': grow,
                'sd-list-item__column--no-border': !border,
                'sd-list-item__column--no-padding': noPadding,
                'sd-list-item__column--has-check': hasCheck,
                'sd-list-item__column--checked': checked,
            },
            className
        )}
    >
        {children}
    </div>
);
