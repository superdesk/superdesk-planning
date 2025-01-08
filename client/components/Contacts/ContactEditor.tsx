import React from 'react';
import {gettext} from '../../utils';

import * as ContactFormComponents from 'superdesk-core/scripts/apps/contacts/components/Form';
import ng from 'superdesk-core/scripts/core/services/ng';
import {Button, Modal, Spacer} from 'superdesk-ui-framework/react';
import {IContact} from 'superdesk-api';

interface IProps {
    currentContact: IContact;
    onSave: (contact: IContact) => void;
    closeModal: () => void;
}

interface IState {
    dirty: boolean;
    valid: boolean;
}

export class ContactEditor extends React.Component<IProps, IState> {
    contactForm: React.RefObject<ContactFormComponents.ContactFormContainer>;

    constructor(props) {
        super(props);
        this.state = {
            dirty: false,
            valid: false,
        };
        this.contactForm = React.createRef();

        this.onDirty = this.onDirty.bind(this);
        this.onValidation = this.onValidation.bind(this);
        this.triggerSave = this.triggerSave.bind(this);
        this.onSave = this.onSave.bind(this);
        this.exitEditor = this.exitEditor.bind(this);
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
        }, () => {
            this.exitEditor(result);
            this.props.closeModal();
        });
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
                size="medium"
                visible
                headerTemplate={gettext('Add Contact')}
                footerTemplate={(
                    <Spacer gap="4" alignItems="end" justifyContent="end" h noGrow>
                        <Button
                            onClick={this.props.closeModal}
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
                    onCancel={this.props.closeModal}
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
