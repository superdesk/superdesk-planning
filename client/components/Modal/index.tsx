import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';
import {default as ModalDialog} from './ModalDialog';
import {default as Header} from './Header';
import {default as Body} from './Body';
import {default as Footer} from './Footer';
import {default as DraggableModal} from './DraggableModal';
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
    backdrop: any;
    draggable: any;
}

class Modal extends React.Component<IProps> {
    static Header: typeof Header;
    static Body: typeof Body;
    static Footer: typeof Footer;

    static propTypes: any;
    static defaultProps: any;

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
            backdrop,
            draggable,
        } = this.props;

        const classes = classNames(className, {
            modal: true,
            'modal--draggable': draggable,
            'modal--large': large,
            'modal--fill': fill,
            'modal--fullscreen': fullscreen,
            'modal--white': white,
            'modal--x-large': xLarge,
        });

        return (
            <_Modal
                show={show}
                backdrop={backdrop}
                className={classes}
                onHide={handleHide}
                dialogComponentClass={draggable ? DraggableModal : ModalDialog}
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
    backdrop: PropTypes.bool,
    draggable: PropTypes.bool,
};

Modal.defaultProps = {
    backdrop: true,
};

Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;

export default Modal;