import React from 'react';
import classNames from 'classnames';

interface IProps {
    children: React.ReactNode;
    className?: string;
    noBorder?: boolean;
    noPadding?: boolean;
}

const Footer = ({children, className, noBorder, noPadding}: IProps) => (
    <div
        className={classNames(
            'popup__menu-footer',
            {
                'popup__menu-footer--no-border': noBorder,
                'popup__menu-footer--no-padding': noPadding,
            },
            className
        )}
    >
        {children}
    </div>
);

export default Footer;
