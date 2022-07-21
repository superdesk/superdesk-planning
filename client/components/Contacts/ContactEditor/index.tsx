import React from 'react';
import {Modal} from '../../index';
import {gettext} from '../../../utils';

import * as ContactFormComponents from 'superdesk-core/scripts/apps/contacts/components/Form';
import {IContact} from 'superdesk-core/scripts/apps/contacts/Contacts';
import ng from 'superdesk-core/scripts/core/services/ng';

interface IProps {
    currentContact: IContact;
    onCancel(): void;
    onSave(contact: IContact): void;
}

interface IState {
    showModal: boolean;
    dirty: boolean;
    valid: boolean;
}

export class ContactEditor extends React.Component<IProps, IState> {
    contactForm: React.RefObject<ContactFormComponents.ContactFormContainer>;

    constructor(props) {
        super(props);
        this.state = {
            showModal: true,
            dirty: false,
            valid: false,
        };
        this.contactForm = React.createRef();

        this.handleCancel = this.handleCancel.bind(this);
        this.onDirty = this.onDirty.bind(this);
        this.onValidation = this.onValidation.bind(this);
        this.triggerSave = this.triggerSave.bind(this);
        this.onSave = this.onSave.bind(this);
        this.exitEditor = this.exitEditor.bind(this);
    }

    handleCancel() {
        this.setState({
            showModal: false,
        }, () => this.props.onCancel());
    }

    onDirty() {
        this.setState({
            dirty: true,
        });
    }

    onValidation(validity) {
        this.setState({
            valid: validity,
        });
    }

    triggerSave() {
        if (this.contactForm.current != null) {
            this.contactForm.current.save();
        }
    }

    exitEditor(result) {
        // wait before exiting contact editor, allowing save changes to be completed on contact form.
        setTimeout(() => this.props.onSave(result), 800);
    }

    onSave(result) {
        this.setState({
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
            <Modal
                className="contact-details-pane contact-details-pane--editor"
                large={true}
                show={this.state.showModal}
            >
                <Modal.Header>
                    <h3 className="modal__heading">{gettext('Add Contact')}</h3>
                    <a className="icn-btn" aria-label={gettext('Close')} onClick={this.handleCancel}>
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body>
                    <ContactFormContainer
                        ref={this.contactForm}
                        contact={currentContact}
                        svc={services}
                        onCancel={this.handleCancel}
                        onDirty={this.onDirty}
                        onValidation={this.onValidation}
                        triggerSave={false}
                        onSave={this.onSave}
                        hideActionBar={true}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <ActionBar
                        svc={services}
                        onCancel={this.handleCancel}
                        dirty={this.state.dirty}
                        valid={this.state.valid}
                        onSave={this.triggerSave}
                    />
                </Modal.Footer>
            </Modal>
        );
    }
}
