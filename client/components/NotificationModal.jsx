import React from 'react'
import { Modal } from './index'
import { Button } from 'react-bootstrap'

export function NotificationModal({ handleHide, modalProps }) {
    const handleClose = () => {
        handleHide()
    }
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
    )
}

NotificationModal.propTypes = {
    handleHide: React.PropTypes.func.isRequired,
    modalProps: React.PropTypes.shape({
        title: React.PropTypes.string,
        body: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.element,
        ]),
    }),
}
