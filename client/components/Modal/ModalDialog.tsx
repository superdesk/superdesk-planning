import React from 'react';
import classNames from 'classnames';
import {pickBy} from 'lodash';

interface IProps {
    dialogClassName?: string;
    children: React.ReactNode;
    style?: any;
    className?: string;
}

export default function ModalDialog({dialogClassName, children, style, className, ...props}: IProps) {
    const modalStyle = {
        display: 'block',
        ...style,
    };
    const bsClasses = [
        'bsClass',
        'bsSize',
        'bsStyle',
        'bsRole',
    ];
    const elementProps = pickBy(props, (value, key) => (bsClasses.indexOf(key) === -1));

    return (
        <div
            {...elementProps}
            role="dialog"
            style={modalStyle}
            className={className}
        >
            <div className={classNames(dialogClassName, 'modal__dialog')}>
                <div className="modal__content" role="document">
                    {children}
                </div>
            </div>
        </div>
    );
}
