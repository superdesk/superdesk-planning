import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';
import {default as ModalDialog} from './ModalDialog';
import {default as Header} from './Header';
import {default as Body} from './Body';
import {default as Footer} from './Footer';
import classNames from 'classnames';
import './style.scss';

export default function Modal({
    show,
    handleHide,
    children,
    large,
    fill,
    fullscreen,
    white,
    className,
}) {
    const classes = classNames(className, {
        modal: true,
        'modal--large': large,
        'modal--fill': fill,
        'modal--fullscreen': fullscreen,
        'modal--white': white,
    });

    return (
        <_Modal
            show={show}
            backdrop={true}
            className={classes}
            onHide={handleHide}
            dialogComponentClass={ModalDialog}
        >{children}</_Modal>
    );
}

Modal.propTypes = {
    show: PropTypes.bool,
    handleHide: PropTypes.func,
    children: PropTypes.array,
    large: PropTypes.bool,
    fill: PropTypes.bool,
    fullscreen: PropTypes.bool,
    white: PropTypes.bool,
    className: PropTypes.string,
};

Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;
