import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../utils';

import {Modal} from './index';
import {ButtonList, Icon} from './UI';

export class ConfirmationModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {submitting: false};
        this.onIgnore = this.onIgnore.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onOK = this.onOK.bind(this);
        this.closeModelAfter = this.closeModelAfter.bind(this);
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

    closeModelAfter(func) {
        const {handleHide, modalProps} = this.props;

        if (!modalProps.autoClose) {
            return func && func();
        }

        this.setState({submitting: true});
        const response = func && func();

        if (response && response.finally) {
            response.finally(() => {
                this.setState({submitting: false});
                handleHide(modalProps.itemType);
            });
        } else {
            this.setState({submitting: false});
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
                    <a className="close" onClick={this.onCancel}>
                        <Icon icon="icon-close-small" />
                    </a>
                    <h3>{modalProps.title || gettext('Confirmation')}</h3>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        {modalProps.body || gettext('Are you sure ?')}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <ButtonList buttonList={buttons} />
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
