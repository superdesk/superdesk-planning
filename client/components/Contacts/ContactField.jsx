import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {get, isEqual, every, map} from 'lodash';
import {ContactEditor, SelectSearchContactsField} from './index';
import * as actions from '../../actions';
import {CONTACTS} from '../../constants';
import {gettext} from '../../utils/index';


export class ContactFieldComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            filteredEventContacts: [],
            fetchedEventContacts: [],
            filteredOptions: [],
            filteredValues: [],
            fetchingContacts: false,
        };

        this.getSearchResult = this.getSearchResult.bind(this);
        this.addOption = this.addOption.bind(this);
        this.getOption = this.getOption.bind(this);
        this.getOptions = this.getOptions.bind(this);
        this.getValue = this.getValue.bind(this);
        this.getContactLabel = this.getContactLabel.bind(this);
        this.editDetails = this.editDetails.bind(this);
        this.fetchContacts = this.fetchContacts.bind(this);
        this.fetchContactsRequired = this.fetchContactsRequired.bind(this);
    }

    fetchContactsRequired() {
        const loadedContactIds = map(this.props.contacts, '_id');

        return !every(
            this.props.value,
            (contactId) => loadedContactIds.indexOf(contactId) >= 0
        );
    }

    fetchContacts() {
        this.setState({fetchingContacts: true});
        this.props.fetchContacts(this.props.value);
    }

    componentDidMount() {
        if (this.fetchContactsRequired()) {
            this.fetchContacts();
        } else {
            this.getOptions(this.props.contacts, false, false);
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.state.fetchingContacts) {
            if (this.fetchContactsRequired()) {
                this.fetchContacts();
            } else if (!isEqual(prevProps.value, this.props.value)) {
                this.getOptions(this.props.contacts, false, false);
            }
        } else if (!isEqual(prevProps.contacts, this.props.contacts)) {
            this.getOptions(this.props.contacts, false, false);
        }
    }

    editDetails(onCancel, currentContact) {
        return (<ContactEditor
            onCancel={onCancel}
            currentContact={currentContact}
            onSave={(savedContact) => this.addOption(savedContact, onCancel)} />);
    }

    addContact(onCancel) {
        const _contact = {public: true, is_active: true};

        return (<ContactEditor
            onCancel={onCancel}
            currentContact={_contact}
            onSave={(savedContact) => this.addOption(savedContact, onCancel)} />);
    }

    addOption(savedContact, onCancel) {
        const {field, ...props} = this.props;
        const opt = this.getOption(savedContact);

        props.addContact(savedContact);
        props.onChange(field, [...props.value, opt.value._id]);

        onCancel();
    }

    getSearchResult(text) {
        this.setState({fetchingContacts: true});
        this.props.searchContacts(text)
            .then((items) => {
                this.getOptions(items || [], true, false);
            });
    }

    getContactLabel(contact) {
        const avatarClass = (contact) => contact.first_name ? 'avatar' : 'avatar organisation';

        const displayContact = (contact) => (contact.first_name ?
            `${contact.first_name} ${contact.last_name}` : contact.organisation);

        const displayContactInfo = (contact) => (contact.first_name && contact.job_title && contact.organisation &&
                <h5>{contact.job_title}, {contact.organisation}</h5>);

        return (<span className="contact-info">
            <figure className={avatarClass(contact)} />
            <span>{displayContact(contact)} {displayContactInfo(contact)}</span>
        </span>);
    }

    getOption(contact) {
        let contactLabel = this.getContactLabel(contact);

        return {
            label: (<span>{contactLabel}</span>),
            value: contact,
        };
    }

    getValue(currentContact) {
        let contactLabel = this.getContactLabel(currentContact);

        return {
            label: (<span>{contactLabel}</span>),
            value: currentContact,
            onEditDetails: ((onCancel) => this.editDetails(onCancel, currentContact)),
        };
    }

    getOptions(filteredContacts, onSearch = false, fetchingContacts = null) {
        let values = [];
        let _filteredValues = [];
        const options = filteredContacts.map((contact) => this.getOption(contact));

        if (!onSearch) {
            const currentValues = get(this.props, 'value') || [];

            values = filteredContacts
                .filter(
                    (contact) => currentValues.includes(get(contact, '_id'))
                )
                .map(
                    (contact) => this.getValue(contact)
                );

            _filteredValues = values;
        } else {
            _filteredValues = this.state.filteredValues;
        }

        this.setState({
            filteredEventContacts: filteredContacts,
            filteredOptions: options,
            filteredValues: _filteredValues,
            fetchingContacts: fetchingContacts !== null ?
                fetchingContacts :
                this.state.fetchingContacts,
        });
    }

    render() {
        const {label, field, privileges, onFocus, refNode, paddingTop, readOnly, ...props} = this.props;

        return (
            <div ref={refNode} className={paddingTop ? 'contact-field--padding-top' : null}>
                <SelectSearchContactsField
                    field={field}
                    label={label}
                    onChange={props.onChange}
                    querySearch={true}
                    onQuerySearch={((text) => this.getSearchResult(text))}
                    options={this.state.filteredOptions}
                    value={this.state.filteredValues}
                    onAdd={privileges.contacts ? (onCancel) => this.addContact(onCancel) : null}
                    onAddText={privileges.contacts ? gettext('Add Contact') : null}
                    onFocus={onFocus}
                    readOnly={readOnly} />
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
        PropTypes.string,
        PropTypes.array,
    ]),
    searchContacts: PropTypes.func,
    fetchContacts: PropTypes.func,
    contacts: PropTypes.array,
    privileges: PropTypes.object,
    refNode: PropTypes.func,
    paddingTop: PropTypes.bool,
    readOnly: PropTypes.bool,
};

const mapStateToProps = (state, ownProps) => ({
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
