import React from 'react'
import { Modal, Button } from 'react-bootstrap'

export function ConfirmationModal({ handleHide, modalProps }) {
    const action = () => (
        Promise.resolve(modalProps.action())
        .then(handleHide)
    )
    return (
        <Modal show={true} onHide={handleHide}>
            <Modal.Header>
                <a className="close" onClick={handleHide}>
                    <i className="icon-close-small" />
                </a>
                <h3>{ modalProps.title || 'Confirmation' }</h3>
            </Modal.Header>
            <Modal.Body>
                { modalProps.body || 'Are you sure ?'}
            </Modal.Body>
            <Modal.Footer>
                <Button type="button" onClick={handleHide}>Cancel</Button>
                <Button type="submit" onClick={action}>Ok</Button>
            </Modal.Footer>
        </Modal>
    )
}

ConfirmationModal.propTypes = {
    handleHide: React.PropTypes.func.isRequired,
    modalProps: React.PropTypes.shape({
        action: React.PropTypes.func.isRequired,
        title: React.PropTypes.string,
        body: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.element,
        ]),
    }),
}
