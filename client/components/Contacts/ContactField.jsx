import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {ContactEditor, SelectSearchContactsField, ContactsPreviewList} from './index';
import * as actions from '../../actions';
import {CONTACTS} from '../../constants';
import {gettext} from '../../utils/index';


export class ContactFieldComponent extends React.Component {
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

    removeContact(contact) {
        const {value, field, onChange} = this.props;
        const index = value.indexOf(contact._id);

        if (index >= 0) {
            value.splice(index, 1);
            onChange(field, value);
        }
    }

    onContactSaved(contact) {
        this.onChange(contact);
        this.closeEditModal();
    }

    onChange(savedContact) {
        const {field, value, addContact, onChange} = this.props;

        // Update the redux store
        addContact(savedContact);

        // Append the value if the id is not in the list already
        if (!value.find((contactId) => contactId === savedContact._id)) {
            onChange(field, [...value, savedContact._id]);
        }
    }

    render() {
        const {label, field, privileges, onFocus, refNode, paddingTop, readOnly} = this.props;

        return (
            <div ref={refNode} className={paddingTop ? 'contact-field--padding-top' : null}>
                <SelectSearchContactsField
                    field={field}
                    label={label}
                    onChange={this.onChange}
                    value={this.props.value}
                    onAdd={privileges.contacts ? this.showEditModal : null}
                    onAddText={privileges.contacts ? gettext('Add Contact') : null}
                    onFocus={onFocus}
                    readOnly={readOnly}
                />

                <ContactsPreviewList
                    contactIds={this.props.value}
                    onEditContact={privileges.contacts ? this.showEditModal : null}
                    onRemoveContact={privileges.contacts ? this.removeContact : null}

                    scrollInView={true}
                    scrollIntoViewOptions={{block: 'center'}}
                    tabEnabled={true}
                    readOnly={this.props.readOnly}
                />

                {this.state.showEditModal && (
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

ContactFieldComponent.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    querySearch: PropTypes.bool,
    onQuerySearch: PropTypes.func,
    onFocus: PropTypes.func,
    value: PropTypes.arrayOf(PropTypes.string),
    searchContacts: PropTypes.func,
    fetchContacts: PropTypes.func,
    contacts: PropTypes.array,
    privileges: PropTypes.object,
    refNode: PropTypes.func,
    paddingTop: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    addContact: PropTypes.func,
};

const mapStateToProps = (state) => ({
    contacts: selectors.general.contacts(state),
    privileges: selectors.general.privileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    searchContacts: (text) => dispatch(actions.contacts.getContacts(text, CONTACTS.SEARCH_FIELDS)),
    addContact: (newContact) => dispatch(actions.contacts.addContact(newContact)),
    fetchContacts: (ids) => dispatch(actions.contacts.fetchContactsByIds(ids)),
});

export const ContactField = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContactFieldComponent);
