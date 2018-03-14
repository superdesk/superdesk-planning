import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../../utils';

import {Modal} from '../index';
import {Button} from '../UI';

import './style.scss';

export class ModalWithForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {submitting: false};

        this.submit = this.submit.bind(this);
        this.onHide = this.onHide.bind(this);
        this.dom = {form: null};
    }

    getFormInstance() {
        // Components connected to the redux store require getWrappedInstance
        // Pure React Components don't
        return this.dom.form.getWrappedInstance() ||
            this.dom.form;
    }

    submit() {
        this.setState({submitting: true});
        // Call the submit method of the form Component
        this.getFormInstance()
            .submit()
            .then(
                this.props.onHide,
                () => {
                    this.props.enableSaveInModal();
                    this.setState({submitting: false});
                }
            );
    }

    onHide() {
        const form = this.getFormInstance();

        // If the form Component has an 'onHide' property,
        // then call that now
        if ('onHide' in form.props) {
            form.props.onHide(this.props.initialValues);
        }

        this.props.onHide();
    }

    render() {
        const {
            show,
            onHide,
            large,
            fill,
            fullscreen,
            white,
            title,
            initialValues,
            enableSaveInModal,
            disableSaveInModal,
            cancelButtonText,
            canSave,
            saveButtonText,
            form,
        } = this.props;

        const Form = form;

        return (
            <Modal
                show={show}
                onHide={onHide}
                large={large}
                fill={fill}
                fullscreen={fullscreen}
                white={white}
            >
                <Modal.Header>
                    <a className="close" onClick={this.onHide}>
                        <i className="icon-close-small" />
                    </a>
                    <h3>{title}</h3>
                </Modal.Header>
                <Modal.Body>
                    <Form
                        initialValues={initialValues}
                        enableSaveInModal={enableSaveInModal}
                        disableSaveInModal={disableSaveInModal}
                        submitting={this.state.submitting}
                        ref={(node) => this.dom.form = node}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={this.onHide}
                        disabled={this.state.submitting}
                        text={cancelButtonText || gettext('Close')}
                    />
                    <Button
                        color="primary"
                        onClick={this.submit}
                        disabled={!canSave || this.state.submitting}
                        text={saveButtonText || gettext('Save')}
                    />
                </Modal.Footer>
            </Modal>
        );
    }
}

ModalWithForm.propTypes = {
    form: PropTypes.func.isRequired,
    initialValues: PropTypes.object,
    title: PropTypes.string,
    show: PropTypes.bool,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    onHide: PropTypes.func,
    canSave: PropTypes.bool,
    cancelButtonText: PropTypes.string,
    saveButtonText: PropTypes.string,
    large: PropTypes.bool,
    fill: PropTypes.bool,
    fullscreen: PropTypes.bool,
    white: PropTypes.bool,
};

ModalWithForm.defaultProps = {
    large: false,
    fill: false,
    fullscreen: false,
};
