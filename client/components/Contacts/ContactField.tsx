import React from 'react';
import {connect} from 'react-redux';
import {superdeskApi} from '../../superdeskApi';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ContactEditor} from './ContactEditor';
import {SelectSearchContactsField} from './SelectSearchContactsField';
import {ContactsPreviewList} from './ContactsPreviewList';
import {IContact, Omit} from 'superdesk-api';
import {showModal} from '@sourcefabric/common';
import {IContactFieldProps, IContactReduxStateProps, IContactReduxDispatchProps} from './ContactField.interface';
import {Row} from './../../components/UI/Form';

const mapStateToProps = (state) => ({
    contacts: selectors.general.contacts(state),
    privileges: selectors.general.privileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    addContact: (newContact) => dispatch(actions.contacts.addContact(newContact)),
});

class ContactFieldComponent extends React.Component<IContactFieldProps> {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.showEditModal = this.showEditModal.bind(this);
        this.removeContact = this.removeContact.bind(this);
    }

    /**
     * @param contact optional because on create there's no contact
     */
    showEditModal(contact?: IContact) {
        const fullContact = contact || ({public: false, is_active: true}) as IContact;

        return showModal(({closeModal}) => (
            <ContactEditor
                closeModal={closeModal}
                currentContact={fullContact}
                onSave={(contact) => {
                    this.onChange(contact);
                    closeModal();
                }}
            />
        ));
    }

    removeContact(contact: IContact) {
        if (this.props.singleValue === true) {
            if (this.props.value === contact._id) {
                this.props.onChange(this.props.field, null);
            }
        } else {
            let value = Array.from(this.props.value ?? []);
            const index = value.indexOf(contact._id);

            if (index >= 0) {
                value.splice(index, 1);
                this.props.onChange(this.props.field, value);
            }
        }
    }

    onChange(savedContact: Partial<IContact>) {
        // Update the redux store
        this.props.addContact(savedContact);

        if (this.props.singleValue === true) {
            if (this.props.value !== savedContact._id) {
                this.props.onChange(this.props.field, savedContact._id);
            }
        } else if (!(this.props.value ?? []).find((contactId) => contactId === savedContact._id)) {
            // Append the value if the id is not in the list already
            this.props.onChange(
                this.props.field,
                [
                    ...(this.props.value ?? []),
                    savedContact._id,
                ]
            );
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            label,
            field,
            privileges,
            onFocus,
            onPopupOpen,
            onPopupClose,
            readOnly,
        } = this.props;

        let value: Array<IContact['_id']>;

        if (this.props.value == null) {
            value = [];
        } else if (this.props.singleValue === true) {
            value = [this.props.value];
        } else {
            value = this.props.value;
        }

        return (
            <Row testId={'contacts-preview-list'}>
                <SelectSearchContactsField
                    field={field}
                    label={label}
                    onChange={this.onChange}
                    value={value}
                    onAdd={privileges.contacts ? this.showEditModal : undefined}
                    onAddText={privileges.contacts ? gettext('Add Contact') : null}
                    onFocus={onFocus}
                    readOnly={readOnly}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                />
                <ContactsPreviewList
                    contactIds={value}
                    onEditContact={privileges.contacts ? this.showEditModal : null}
                    onRemoveContact={privileges.contacts ? this.removeContact : null}
                />
            </Row>
        );
    }
}

export const ContactField = connect<
    IContactReduxStateProps,
    IContactReduxDispatchProps,
    Omit<IContactFieldProps, keyof IContactReduxStateProps | keyof IContactReduxDispatchProps>
>(
    mapStateToProps,
    mapDispatchToProps
)(ContactFieldComponent);
