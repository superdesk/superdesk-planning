import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from '../index';

import * as ContactFormComponents from 'superdesk-core/scripts/apps/contacts/components/Form';
import ng from 'superdesk-core/scripts/core/services/ng';

export class ContactEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: true,
            dirty: null,
            valid: null,
            triggerSave: null,
        };
        this.handleCancel = this.handleCancel.bind(this);
        this.onDirty = this.onDirty.bind(this);
        this.onValidation = this.onValidation.bind(this);
        this.triggerSave = this.triggerSave.bind(this);
        this.onSave = this.onSave.bind(this);
        this.exitEditor = this.exitEditor.bind(this);
    }

    handleCancel() {
        this.setState({
            showModal: false
        }, this.props.onCancel());
    }

    onDirty() {
        this.setState({
            dirty: true
        });
    }

    onValidation(validity) {
        this.setState({
            valid: validity
        });
    }

    triggerSave() {
        this.setState({
            triggerSave: true
        });
    }

    exitEditor(result) {
        this.props.onSave(result);
    }

    onSave(result) {
        this.setState({
            triggerSave: false,
            dirty: false,
            showModal: false,
        }, () => this.exitEditor(result));
    }

    render() {
        const {ContactFormContainer, ActionBar} = ContactFormComponents;
        const {currentContact} = this.props;

        // Provides required services for Contact components
        const services = {
            contacts: ng.get('contacts'),
            gettext: ng.get('gettext'),
            notify: ng.get('notify'),
            privileges: ng.get('privileges'),
            metadata: ng.get('metadata'),
        };

        return (
            <Modal className="contact-details-pane contact-details-pane--editor"
                large={true} show={this.state.showModal}>
                <Modal.Header>
                    <a className="close" onClick={this.handleCancel}>
                        <i className="icon-close-small" />
                    </a>
                    <h3 className="modal__heading">{gettext('Add Contact')}</h3>
                </Modal.Header>
                <Modal.Body>
                    <ContactFormContainer
                        contact={currentContact}
                        svc={services}
                        onCancel={this.handleCancel}
                        onDirty={this.onDirty}
                        onValidation={this.onValidation}
                        triggerSave={this.state.triggerSave}
                        onSave={this.onSave}
                        hideActionBar={true} />
                </Modal.Body>
                <Modal.Footer>
                    <ActionBar
                        svc={services}
                        onCancel={this.handleCancel}
                        dirty={this.state.dirty}
                        valid={this.state.valid}
                        onSave={this.triggerSave} />
                </Modal.Footer>
            </Modal>
        );
    }
}

ContactEditor.propTypes = {
    onCancel: PropTypes.func,
    currentContact: PropTypes.object,
    onSave: PropTypes.func,
};
