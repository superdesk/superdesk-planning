import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from './index';
import {Button} from 'react-bootstrap';

export function NotificationModal({handleHide, modalProps}) {
    const handleClose = () => {
        handleHide();
        if (modalProps.action) {
            modalProps.action();
        }
    };

    return (
        <Modal show={true} onHide={handleClose}>
            <Modal.Header>
                <a className="close" onClick={handleClose}>
                    <i className="icon-close-small" />
                </a>
                <h3>{ modalProps.title || 'Notification' }</h3>
            </Modal.Header>
            <Modal.Body>
                <div>
                    { modalProps.body }
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button type="button" onClick={handleClose}>OK</Button>
            </Modal.Footer>
        </Modal>
    );
}

NotificationModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        title: PropTypes.string,
        body: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.element,
        ]),
        action: PropTypes.func,
    }),
};
