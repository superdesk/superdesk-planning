import React from 'react';

import {gettext} from '../utils';

import {KEYCODES} from '../constants';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

interface IProps {
    handleHide(itemType?: string): void;
    modalProps: {
        onCancel?(): void;
        cancelText?: string;
        ignore?(): void;
        showIgnore?: boolean;
        ignoreText?: string;
        okText?: string;
        action?(): void;
        title?: string;
        body: React.ReactNode;
        itemType?: string;
        autoClose?: boolean;
        bodyClassname?: string;
        size?: 'small' | 'medium' | 'large' | 'x-large';
        position?:
            'center'
            | 'top'
            | 'bottom'
            | 'left'
            | 'right'
            | 'top-left'
            | 'top-right'
            | 'bottom-left'
            | 'bottom-right';
    };
}

interface IState {
    submitting: boolean;
}

export class ConfirmationModal extends React.Component<IProps, IState> {
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

        if (response && response.catch) {
            response.catch(() => {
                this.setState({submitting: false});
            });
        }

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

        const buttons: Array<{
            type?: 'primary' | 'secondary' | 'tertiary';
            onClick: () => void;
            text: string;
            disabled: boolean;
            'data-test-id'?: string;
        }> = [{
            type: 'secondary',
            onClick: this.onCancel,
            text: modalProps.cancelText || gettext('Cancel'),
            disabled: submitting,
            'data-test-id': 'cancel-button',
        }];

        if (modalProps.action != null) {
            buttons.push({
                type: 'primary',
                onClick: this.onOK,
                text: modalProps.okText ?? gettext('Ok'),
                disabled: submitting,
                'data-test-id': 'ok-button',
            });
        }

        if (modalProps.showIgnore === true) {
            buttons.unshift({
                type: 'tertiary',
                onClick: this.onIgnore,
                text: modalProps.ignoreText ?? gettext('Ignore'),
                disabled: submitting,
                'data-test-id': 'ignore-button',
            });
        }

        return (
            <Modal
                visible
                position={this.props.modalProps.position}
                onHide={this.onCancel}
                size={this.props.modalProps.size}
                headerTemplate={modalProps.title ?? gettext('Confirmation')}
                footerTemplate={(
                    <ButtonGroup align="end" padded={false} orientation="horizontal" spaces="compact">
                        {buttons.map((props) => (
                            <Button
                                key={props.text}
                                {...props}
                            />
                        ))}
                    </ButtonGroup>
                )}
                className={this.props.modalProps.bodyClassname}
            >
                {modalProps.body ?? gettext('Are you sure ?')}
            </Modal>
        );
    }
}
