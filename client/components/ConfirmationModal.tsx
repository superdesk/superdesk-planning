import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../utils';

import {Modal} from './index';
import {ButtonList, Icon} from './UI';
import {KEYCODES} from '../constants';

export class ConfirmationModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {submitting: false};
        this.onIgnore = this.onIgnore.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onOK = this.onOK.bind(this);
        this.closeModelAfter = this.closeModelAfter.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    onIgnore() {
        this.closeModelAfter(this.props.modalProps.ignore);
    }

    onCancel() {
        this.closeModelAfter(this.props.modalProps.onCancel);
    }

    onOK() {
        this.closeModelAfter(this.props.modalProps.action);
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
            this.onCancel();
        }
    }

    closeModelAfter(func) {
        const {handleHide, modalProps} = this.props;

        if (!modalProps.autoClose) {
            return func && func();
        }

        this.setState({submitting: true});
        const response = func && func();

        if (response && response.finally) {
            response.finally(() => {
                handleHide(modalProps.itemType);
            });
        } else {
            handleHide(modalProps.itemType);
        }
    }

    render() {
        const {modalProps} = this.props;
        const {submitting} = this.state;

        let buttons = [{
            type: 'button',
            onClick: this.onCancel,
            text: modalProps.cancelText || gettext('Cancel'),
            disabled: submitting,
        }];

        if (modalProps.action) {
            buttons.push({
                color: 'primary',
                type: 'submit',
                onClick: this.onOK,
                text: modalProps.okText || gettext('Ok'),
                disabled: submitting,
            });
        }

        if (modalProps.showIgnore) {
            buttons.unshift({
                type: 'reset',
                onClick: this.onIgnore,
                text: modalProps.ignoreText || gettext('Ignore'),
                disabled: submitting,
            });
        }

        return (
            <Modal show={true} onHide={this.onCancel}>
                <Modal.Header>
                    <h3 className="modal__heading">{modalProps.title || gettext('Confirmation')}</h3>
                    <a className="icn-btn" aria-label={gettext('Close')} onClick={this.onCancel}>
                        <Icon icon="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        {modalProps.body || gettext('Are you sure ?')}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <ButtonList buttonList={buttons} right={false} />
                </Modal.Footer>
            </Modal>
        );
    }
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
        action: PropTypes.func,
        title: PropTypes.string,
        body: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.element,
        ]),
        itemType: PropTypes.string,
        autoClose: PropTypes.bool,
    }),
};
