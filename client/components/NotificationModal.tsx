import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from './index';
import {Button} from 'react-bootstrap';
import {KEYCODES} from '../constants';
import {superdeskApi} from '../superdeskApi';

export class NotificationModal extends React.Component {
    constructor(props) {
        super(props);
        this.handleClose = this.handleClose.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(event) {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.handleClose();
        }
    }

    handleClose() {
        this.props.handleHide();
        if (this.props.modalProps.action) {
            this.props.modalProps.action();
        }
    }

    render() {
        const {modalProps} = this.props;
        const {gettext} = superdeskApi.localization;

        return (
            <Modal show={true} onHide={this.handleClose}>
                <Modal.Header>
                    <h3 className="modal__heading">{ modalProps.title || gettext('Notification') }</h3>
                    <a className="icn-btn" aria-label={gettext('Close')} onClick={this.handleClose}>
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        { modalProps.body }
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button" onClick={this.handleClose}>OK</Button>
                </Modal.Footer>
            </Modal>
        );
    }
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
