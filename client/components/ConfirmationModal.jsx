import React from 'react'
import { Modal } from './index'
import { Button } from 'react-bootstrap'

export function ConfirmationModal({ handleHide, modalProps }) {
    const action = () => (
        Promise.resolve(modalProps.action())
        .then(handleHide)
    )
    const handleCancel = () => {
        handleHide()
        if (modalProps.onCancel) {
            modalProps.onCancel()
        }
    }
    return (
        <Modal show={true} onHide={handleCancel}>
            <Modal.Header>
                <a className="close" onClick={handleCancel}>
                    <i className="icon-close-small" />
                </a>
                <h3>{ modalProps.title || 'Confirmation' }</h3>
            </Modal.Header>
            <Modal.Body>
                <div>
                    { modalProps.body || 'Are you sure ?'}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button type="button" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" onClick={action}>Ok</Button>
            </Modal.Footer>
        </Modal>
    )
}

ConfirmationModal.propTypes = {
    handleHide: React.PropTypes.func.isRequired,
    modalProps: React.PropTypes.shape({
        onCancel: React.PropTypes.func,
        action: React.PropTypes.func.isRequired,
        title: React.PropTypes.string,
        body: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.element,
        ]),
    }),
}
