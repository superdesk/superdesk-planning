import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
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
        if (this.props.singleValue) {
            this.applyChanges(null);
            return;
        }

        let value = this.getValueProp();
        const index = value.indexOf(contact._id);

        if (index >= 0) {
            value.splice(index, 1);
            this.applyChanges(value);
        }
    }

    onContactSaved(contact) {
        this.onChange(contact);
        this.closeEditModal();
    }

    applyChanges(newValue) {
        const {field, singleValue, value, onChange} = this.props;

        if (!singleValue) {
            if (Array.isArray(newValue)) {
                // When we remove contact, an array is given
                onChange(field, newValue);
            } else {
                onChange(field, [...value, newValue]);
            }
        } else {
            onChange(field, newValue);
        }
    }

    onChange(savedContact) {
        const value = this.getValueProp();

        // Update the redux store
        this.props.addContact(savedContact);

        // Append the value if the id is not in the list already
        if (!value.find((contactId) => contactId === savedContact._id)) {
            this.applyChanges(savedContact._id);
        }
    }

    getValueProp() {
        if (this.props.singleValue) {
            return get(this.props, 'value.length', 0) > 0 ? [this.props.value] : [];
        }

        return this.props.value;
    }

    render() {
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

        return (
            <div ref={refNode} className={paddingTop ? 'contact-field--padding-top' : null}>
                <SelectSearchContactsField
                    field={field}
                    label={label}
                    onChange={this.onChange}
                    value={this.getValueProp()}
                    onAdd={privileges.contacts ? this.showEditModal : null}
                    onAddText={privileges.contacts ? gettext('Add Contact') : null}
                    onFocus={onFocus}
                    readOnly={readOnly}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                />

                <ContactsPreviewList
                    contactIds={this.getValueProp()}
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
    value: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string,
    ]),
    searchContacts: PropTypes.func,
    fetchContacts: PropTypes.func,
    contacts: PropTypes.array,
    privileges: PropTypes.object,
    refNode: PropTypes.func,
    paddingTop: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    addContact: PropTypes.func,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    singleValue: PropTypes.bool,
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
