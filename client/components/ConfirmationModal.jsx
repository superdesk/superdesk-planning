import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from './index';
import {ButtonList} from './UI/index';

export function ConfirmationModal({handleHide, modalProps}) {
    const action = modalProps.action ? () => (
        Promise.resolve(modalProps.action())
            .then(handleHide(modalProps.itemType))) : null;
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

    let buttons = [{
        type: 'button',
        onClick: handleCancel,
        text: modalProps.cancelText || 'Cancel'
    }];

    if (action) {
        buttons.push({
            className: 'btn--primary',
            type: 'submit',
            onClick: action,
            text: modalProps.okText || 'Ok',
        });
    }

    if (modalProps.showIgnore) {
        buttons.unshift({
            type: 'reset',
            onClick: handleIgnore,
            text: modalProps.ignoreText || 'Ignore'
        });
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
                <ButtonList buttonList={buttons} />
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
