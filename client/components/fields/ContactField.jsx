import React from 'react';
import PropTypes from 'prop-types';
import {SelectSearchTermsField} from './SelectSearchTermsField/';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {get, isEqual} from 'lodash';
import {ContactInfoContainer, ContactEditor} from '../index';
import eventsApi from '../../actions/events/api';
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
        };

        this.getSearchResult = this.getSearchResult.bind(this);
        this.fetchEventContacts = this.fetchEventContacts.bind(this);
        this.getResponseResult = this.getResponseResult.bind(this);
        this.addOption = this.addOption.bind(this);
        this.getOption = this.getOption.bind(this);
        this.getOptions = this.getOptions.bind(this);
        this.getValue = this.getValue.bind(this);
        this.getContactLabel = this.getContactLabel.bind(this);
        this.viewDetails = this.viewDetails.bind(this);
        this.editDetails = this.editDetails.bind(this);
    }

    componentDidMount() {
        this.fetchEventContacts(this.props.value);
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(nextProps.value, this.props.value)) {
            this.fetchEventContacts(nextProps.value);
        }
    }

    // Renders Contact information card
    viewDetails(onCancel, currentContact) {
        return (
            <ContactInfoContainer
                target="icon-external"
                onCancel={onCancel}
                currentContact={currentContact} />
        );
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

        props.onChange(field, [...props.value, opt.value]);

        onCancel();
    }

    getSearchResult(text) {
        this.props.searchContacts(text)
            .then(this.getResponseResult)
            .then((results) => {
                this.getOptions(results || [], true);
            });
    }

    fetchEventContacts(values) {
        this.props.fetchContacts(values)
            .then(this.getResponseResult)
            .then((results) => {
                this.getOptions(results || []);
            });
    }

    getResponseResult(data = null) {
        let results = null;

        if (get(data, '_items.length', 0) > 0) {
            results = data._items;
        }

        return results;
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
            value: contact._id,
        };
    }

    getValue(currentContact) {
        let contactLabel = this.getContactLabel(currentContact);

        return {
            label: (<span>{contactLabel}</span>),
            value: currentContact._id,
            onViewDetails: ((onCancel) => this.viewDetails(onCancel, currentContact)),
            onEditDetails: ((onCancel) => this.editDetails(onCancel, currentContact)),
        };
    }

    getOptions(filteredContacts = this.props.eventContacts, onSearch) {
        let options = [];
        let values = [];
        let _filteredValues = [];

        options = (filteredContacts).map((contact) => this.getOption(contact));

        if (!onSearch) {
            values = (filteredContacts).map((contact) => this.getValue(contact));

            _filteredValues = values;
        } else {
            _filteredValues = this.state.filteredValues;
        }

        this.setState({
            filteredEventContacts: filteredContacts,
            filteredOptions: options,
            filteredValues: _filteredValues,
        });
    }

    render() {
        const {label, field, privileges, onFocus, ...props} = this.props;

        return (
            <SelectSearchTermsField
                field={field}
                label={label}
                onChange={props.onChange}
                querySearch={true}
                valueKey="value"
                onQuerySearch={((text) => this.getSearchResult(text))}
                options={this.state.filteredOptions}
                value={this.state.filteredValues}
                onAdd={privileges.contacts ? (onCancel) => this.addContact(onCancel) : null}
                onAddText={privileges.contacts ? gettext('Add Contact') : null}
                onFocus={onFocus} />
        );
    }
}

ContactFieldComponent.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    querySearch: PropTypes.bool,
    onQuerySearch: PropTypes.func,
    onFocus: PropTypes.func,
    valueKey: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.array,
    ]),
    searchContacts: PropTypes.func,
    fetchContacts: PropTypes.func,
    eventContacts: PropTypes.array,
    privileges: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => ({
    eventContacts: selectors.events.getEventContacts(state),
    privileges: selectors.general.privileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    searchContacts: (text) => dispatch(eventsApi.getEventContacts(text, CONTACTS.SEARCH_FIELDS)),
    fetchContacts: (ids) => dispatch(eventsApi.fetchEventContactsByIds(ids || [])),
});

export const ContactField = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContactFieldComponent);
