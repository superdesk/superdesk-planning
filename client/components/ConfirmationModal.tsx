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
        large?: boolean;
        bodyClassname?: string;
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
            color?: string;
            type: string;
            onClick: () => void;
            text: string;
            disabled: boolean;
        }> = [{
            type: 'button',
            onClick: this.onCancel,
            text: modalProps.cancelText || gettext('Cancel'),
            disabled: submitting,
        }];

        if (modalProps.action != null) {
            buttons.push({
                color: 'primary',
                type: 'submit',
                onClick: this.onOK,
                text: modalProps.okText ?? gettext('Ok'),
                disabled: submitting,
            });
        }

        if (modalProps.showIgnore === true) {
            buttons.unshift({
                type: 'reset',
                onClick: this.onIgnore,
                text: modalProps.ignoreText ?? gettext('Ignore'),
                disabled: submitting,
            });
        }

        return (
            <Modal
                visible
                onHide={this.onCancel}
                size={this.props.modalProps.large ? 'large' : 'small'}
                headerTemplate={modalProps.title ?? gettext('Confirmation')}
                footerTemplate={(
                    <ButtonGroup align="end" padded={false} orientation="horizontal" spaces="compact">
                        {buttons.map((props) => (
                            <Button
                                {...props}
                                key={props.text}
                                type={props.color === 'primary' ? 'primary' : 'tertiary'}
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
