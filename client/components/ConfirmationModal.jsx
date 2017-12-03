import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from './index';
import {Button} from 'react-bootstrap';

export function ConfirmationModal({handleHide, modalProps}) {
    const action = () => (
        Promise.resolve(modalProps.action())
            .then(handleHide(modalProps.deselectEventsAfterAction))
    );
    const handleCancel = () => {
        handleHide();
        if (modalProps.onCancel) {
            modalProps.onCancel();
        }
    };

    const handleIgnore = () => {
        handleHide();
        if (modalProps.ignore) {
            modalProps.ignore();
        }
    };

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
                {modalProps.showIgnore &&
                    <Button type="reset" onClick={handleIgnore}>{modalProps.ignoreText || 'Ignore'}</Button>
                }
                <Button type="button" onClick={handleCancel}>{modalProps.cancelText || 'Cancel'}</Button>
                <Button className="btn--primary" type="submit" onClick={action}>{modalProps.okText || 'Ok'}</Button>
            </Modal.Footer>
        </Modal>
    );
}

ConfirmationModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        onCancel: PropTypes.func,
        cancelText: PropTypes.string,
        ignore: PropTypes.func,
        showIgnore: PropTypes.bool,
        ignoreText: PropTypes.string,
        okText: PropTypes.string,
        action: PropTypes.func.isRequired,
        title: PropTypes.string,
        body: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.element,
        ]),
    }),
};
