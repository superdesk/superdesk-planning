import React from 'react';
import {gettext} from '../../utils';

import * as ContactFormComponents from 'superdesk-core/scripts/apps/contacts/components/Form';
import ng from 'superdesk-core/scripts/core/services/ng';
import {Button, Modal, Spacer} from 'superdesk-ui-framework/react';
import {IContact} from 'superdesk-api';

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

        this.hideModal = this.hideModal.bind(this);
        this.onDirty = this.onDirty.bind(this);
        this.onValidation = this.onValidation.bind(this);
        this.triggerSave = this.triggerSave.bind(this);
        this.onSave = this.onSave.bind(this);
        this.exitEditor = this.exitEditor.bind(this);
    }

    hideModal() {
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
        const {ContactFormContainer} = ContactFormComponents;
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
                closeOnEscape
                visible={this.state.showModal}
                size="medium"
                headerTemplate={gettext('Add Contact')}
                footerTemplate={(
                    <Spacer gap="4" alignItems="end" justifyContent="end" h noGrow>
                        <Button
                            onClick={this.hideModal}
                            text={gettext('Cancel')}
                        />
                        <Button
                            style="filled"
                            type="primary"
                            onClick={this.triggerSave}
                            text={gettext('Save')}
                            disabled={!this.state.valid || !this.state.dirty}
                        />
                    </Spacer>
                )}
            >
                <ContactFormContainer
                    ref={this.contactForm}
                    contact={currentContact}
                    svc={services}
                    onCancel={this.hideModal}
                    onDirty={this.onDirty}
                    onValidation={this.onValidation}
                    triggerSave={false}
                    onSave={this.onSave}
                    hideActionBar={true}
                />
            </Modal>
        );
    }
}
