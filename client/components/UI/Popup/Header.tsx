import React from 'react';
import classNames from 'classnames';
import Label from './Label';

interface IProps {
    text: string;
    onClose(): void;
    children: React.ReactNode;
    className: string;
    noBorder: boolean;
    noPadding: boolean;
    centerText: boolean;
    testId: string;
}

const Header = ({text, onClose, children, className, noBorder, noPadding, centerText, testId}: IProps) => (
    <div
        className={classNames(
            'popup__menu-header',
            {
                'popup__menu-header--no-border': noBorder,
                'popup__menu-header--no-padding': noPadding,
            },
            className
        )}
        data-test-id={testId}
    >
        {text && (
            <Label text={text} centerText={centerText}>
                {onClose && (
                    <button className="popup__menu-close" onClick={onClose}>
                        <i className="icon-close-small" />
                    </button>
                )}
            </Label>
        )}
        {children}
    </div>
);

export default Header;
