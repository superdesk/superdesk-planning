import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';
import {default as ModalDialog} from './ModalDialog';
import {default as Header} from './Header';
import {default as Body} from './Body';
import {default as Footer} from './Footer';
import classNames from 'classnames';
import './style.scss';

interface IProps {
    show?: any;
    handleHide?: any;
    children?: any;
    xLarge?: any;
    large?: any;
    fill?: any;
    fullscreen?: any;
    white?: any;
    className?: any;
    fullheight?: any;
}

export class Modal extends React.Component<IProps> {
    static Header: typeof Header;
    static Body: typeof Body;
    static Footer: typeof Footer;

    static propTypes: any;

    render() {
        const {
            show,
            handleHide,
            children,
            xLarge,
            large,
            fill,
            fullscreen,
            white,
            className,
            fullheight,
        } = this.props;
    
        const classes = classNames(className, {
            modal: true,
            'modal--large': large,
            'modal--fill': fill,
            'modal--fullscreen': fullscreen,
            'modal--white': white,
            'modal--x-large': xLarge,
        });
    
        return (
            <_Modal
                show={show}
                backdrop={true}
                className={classes}
                onHide={handleHide}
                dialogComponentClass={ModalDialog}
                dialogClassName={fullheight ? 'modal__dialog--full-height' : undefined}
            >{children}</_Modal>
        );
    }
}

Modal.propTypes = {
    show: PropTypes.bool,
    handleHide: PropTypes.func,
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.arrayOf(PropTypes.node),
    ]),
    large: PropTypes.bool,
    fill: PropTypes.bool,
    fullscreen: PropTypes.bool,
    white: PropTypes.bool,
    xLarge: PropTypes.bool,
    className: PropTypes.string,
    fullheight: PropTypes.bool,
};

Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;
