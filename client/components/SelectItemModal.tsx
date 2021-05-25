import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from './index';
import {Button} from 'react-bootstrap';
import {superdeskApi} from '../superdeskApi';

export const SelectItemModal = ({handleHide, modalProps}) => {
    const handleClose = () => {
        handleHide();
    };
    const handleCancel = () => {
        handleHide();
        if (modalProps.onCancel) {
            modalProps.onCancel();
        }
    };
    const handleSelect = (value) => {
        handleHide();
        modalProps.onSelect(value);
    };

    const {gettext} = superdeskApi.localization;

    const classes = 'sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border';

    return (
        <Modal show={true} onHide={handleClose}>
            <Modal.Header>
                <h3 className="modal__heading">{ modalProps.title || gettext('Select item') }</h3>
                <a className="icn-btn" aria-label={gettext('Close')} onClick={handleCancel}>
                    <i className="icon-close-small" />
                </a>
            </Modal.Header>
            <Modal.Body>
                <div className="sd-list-item-group sd-list-item-group--space-between-items">
                    { modalProps.items.map((item, index) => (
                        <button
                            className="sd-list-item sd-shadow--z1"
                            key={index}
                            onClick={() => handleSelect(item.value)}
                        >
                            <div className={classes}>
                                <div className="sd-list-item__row">
                                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                        </button>
                    )
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button type="button" onClick={handleCancel}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
};

SelectItemModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        title: PropTypes.string,
        items: PropTypes.array,
        onSelect: PropTypes.func.isRequired,
        onCancel: PropTypes.func,
    }),
};
