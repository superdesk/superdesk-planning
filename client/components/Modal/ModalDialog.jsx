import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {pickBy} from 'lodash';

export default function ModalDialog({dialogClassName, children, style, className, ...props}) {
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
            tabIndex="-1"
            role="dialog"
            style={modalStyle}
            className={className}>
            <div className={classNames(dialogClassName, 'modal__dialog')}>
                <div className="modal__content" role="document">
                    {children}
                </div>
            </div>
        </div>
    );
}

ModalDialog.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
    style: PropTypes.object,
    className: PropTypes.string,
    dialogClassName: PropTypes.string,
};
