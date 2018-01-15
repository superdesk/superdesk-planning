import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from '../index';
import {Button} from 'react-bootstrap';
import './style.scss';
import {isBoolean} from 'lodash';
import {isPristine, isSubmitting} from 'redux-form';
import {connect} from 'react-redux';

export class Component extends React.Component {
    constructor(props) {
        super(props);

        // This is to manage submitting state for non-Redux forms
        this.state = {submitting: false};

        this.submit = this.submit.bind(this);
        this.onHide = this.onHide.bind(this);
        this.dom = {form: null};
    }

    getFormInstance() {
        // Assignments forms use redux-form which needs getWrappedInstance()
        // This should be edited when refactoring Assignments UI

        return this.dom.form.getWrappedInstance() ||
            this.dom.form;
    }

    submit() {
        this.getFormInstance().submit();
    }

    onHide() {
        if ('onHide' in this.getFormInstance().props) {
            this.dom.form.getWrappedInstance().props.onHide(this.props.initialValues);
        }

        this.props.onHide();
    }

    render() {
        const form = React.createElement(this.props.form, {
            initialValues: this.props.initialValues,
            enableSaveInModal: this.props.enableSaveInModal,
            disableSaveInModal: this.props.disableSaveInModal,
            ref: (node) => this.dom.form = node,
        });

        return (
            <Modal show={this.props.show}
                onHide={this.props.onHide}
                large={isBoolean(this.props.large) ? this.props.large : false}
                fill={isBoolean(this.props.fill) ? this.props.fill : false}
                fullscreen={isBoolean(this.props.fullscreen) ? this.props.fullscreen : false}
                white={isBoolean(this.props.white) ? this.props.white : false}>
                <Modal.Header>
                    <a className="close" onClick={this.onHide}>
                        <i className="icon-close-small" />
                    </a>
                    <h3>{ this.props.title }</h3>
                </Modal.Header>
                <Modal.Body>
                    { form }
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={this.onHide}
                        disabled={this.props.submitting}
                    >
                        { this.props.cancelButtonText || 'Close' }
                    </Button>
                    <Button type="submit"
                        className="btn btn--primary"
                        onClick={this.submit}
                        disabled={this.props.pristine ||
                        !this.props.canSave ||
                        this.props.submitting ||
                        this.state.submitting}>
                        { this.props.saveButtonText || 'Save' }
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

Component.propTypes = {
    form: PropTypes.func.isRequired,
    // eslint-disable-next-line react/no-unused-prop-types
    formNameForPristineCheck: PropTypes.string,
    initialValues: PropTypes.object,
    title: PropTypes.string,
    show: PropTypes.bool,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    onHide: PropTypes.func,
    pristine: PropTypes.bool,
    canSave: PropTypes.bool,
    submitting: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.bool,
    ]),
    cancelButtonText: PropTypes.string,
    saveButtonText: PropTypes.string,
    large: PropTypes.bool,
    fill: PropTypes.bool,
    fullscreen: PropTypes.bool,
    white: PropTypes.bool,
};

const mapStateToProps = (state, ownProps) => ({
    pristine: ownProps.formNameForPristineCheck ?
        isPristine(ownProps.formNameForPristineCheck)(state) : false,
    submitting: ownProps.formNameForPristineCheck ?
        isSubmitting(ownProps.formNameForPristineCheck)(state) : false,
});

export const ModalWithForm = connect(
    mapStateToProps,
    null
)(Component);
