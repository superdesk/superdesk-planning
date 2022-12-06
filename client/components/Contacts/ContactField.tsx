import React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../superdeskApi';
import {IContactItem, IPrivileges} from '../../interfaces';

import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {ContactEditor, SelectSearchContactsField, ContactsPreviewList} from './index';

interface IBaseProps {
    field: string;
    label: string;
    querySearch?: boolean;
    contacts: Array<IContactItem>;
    privileges: IPrivileges;
    readOnly?: boolean;
    paddingTop?: boolean;
    testId?: string;

    onFocus?(): void;
    refNode?(node: HTMLElement): void;
    addContact(contact: Partial<IContactItem>): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

interface ISingleContactProps extends IBaseProps {
    singleValue: true;
    value: IContactItem['_id'] | null;
    onChange(field: string, value: IContactItem['_id'] | null): void;
}

interface IMultiContactProps extends IBaseProps {
    singleValue: false;
    value: Array<IContactItem['_id']> | null;
    onChange(field: string, value: Array<IContactItem['_id']>): void;
}

type IProps = ISingleContactProps | IMultiContactProps;

interface IState {
    showEditModal: boolean;
    editContact?: IContactItem;
}

const mapStateToProps = (state) => ({
    contacts: selectors.general.contacts(state),
    privileges: selectors.general.privileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    addContact: (newContact) => dispatch(actions.contacts.addContact(newContact)),
});

export class ContactFieldComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            showEditModal: false,
            editContact: null,
        };

        this.onChange = this.onChange.bind(this);
        this.showEditModal = this.showEditModal.bind(this);
        this.closeEditModal = this.closeEditModal.bind(this);
        this.removeContact = this.removeContact.bind(this);
        this.onContactSaved = this.onContactSaved.bind(this);
    }

    showEditModal(contact) {
        this.setState({
            showEditModal: true,
            editContact: contact || {public: true, is_active: true},
        });
    }

    closeEditModal() {
        this.setState({
            showEditModal: false,
            editContact: null,
        });
    }

    removeContact(contact: IContactItem) {
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

    onContactSaved(contact) {
        this.onChange(contact);
        this.closeEditModal();
    }

    onChange(savedContact: Partial<IContactItem>) {
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
                    ...this.props.value,
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
            refNode,
            paddingTop,
            onPopupOpen,
            onPopupClose,
            readOnly,
        } = this.props;

        let value: Array<IContactItem['_id']>;

        if (this.props.value == null) {
            value = [];
        } else if (this.props.singleValue === true) {
            value = [this.props.value];
        } else {
            value = this.props.value;
        }

        return (
            <div
                ref={refNode}
                className={paddingTop ? 'contact-field--padding-top' : null}
                data-test-id={this.props.testId}
            >
                <SelectSearchContactsField
                    field={field}
                    label={label}
                    onChange={this.onChange}
                    value={value}
                    onAdd={privileges.contacts ? this.showEditModal : null}
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
                    scrollInView={true}
                    scrollIntoViewOptions={{block: 'center'}}
                    tabEnabled={true}
                    readOnly={this.props.readOnly}
                />

                {this.state.showEditModal && this.state.editContact != null && (
                    <ContactEditor
                        onCancel={this.closeEditModal}
                        currentContact={this.state.editContact}
                        onSave={this.onContactSaved}
                    />
                )}
            </div>
        );
    }
}

export const ContactField = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContactFieldComponent);
