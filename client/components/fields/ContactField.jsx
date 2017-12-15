import React from 'react';
import {SelectSearchTermsField} from './SelectSearchTermsField/';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {get, join, find, map} from 'lodash';
import {ContactInfoContainer} from './ContactInfoContainer';

// Renders Contact information card
const viewDetails = (onCancel, currentContact) => (<div>
    {<ContactInfoContainer onCancel={onCancel} currentContact={currentContact} />}
</div>);

const avatarClass = (contact) => contact.first_name ? 'avatar' : 'avatar organisation';

const displayContact = (contact) => (contact.first_name ?
    `${contact.first_name} ${contact.last_name}` : contact.organisation);

const displayContactInfo = (contact) => (contact.first_name && contact.job_title && contact.organisation &&
            <h5>{contact.job_title}, {contact.organisation}</h5>);

// Provides searchable Field values to be included for filtering the contact list.
const getSearchFields = (contact) => {
    let contactEmail = get(contact, 'email') && join(contact.email, ' ');
    let contactPhone = find(contact.phone, 'number') && join(map(contact.phone, 'number'), ' ');
    let contactMobile = find(contact.mobile, 'number') && join(map(contact.mobile, 'number'), ' ');

    return (`${contact.first_name} ${contact.last_name} ${contact.organisation} ${contact.job_title} ${contactEmail} ` +
                `${contactPhone} ${contactMobile}`);
};

const mapStateToProps = (state, ownProps) => ({
    multi: true,
    valueKey: 'searchFields',
    options: selectors.getEventContacts(state).map((contact) => {
        let contactLabel = (<span className="contact-info">
            <figure className={avatarClass(contact)} />
            <span>{displayContact(contact)} {displayContactInfo(contact)}</span>
        </span>);

        return {
            label: (<span>{contactLabel}</span>),
            searchFields: getSearchFields(contact),
            value: contact._id,
        };
    }),
    value: (ownProps.input.value || []).map((contact) => {
        const currentContact = (state.contacts || []).find((c) => c._id === contact);

        let contactLabel = (<span className="contact-info">
            <figure className={avatarClass(currentContact)} />
            <span>{displayContact(currentContact)} {displayContactInfo(currentContact)}</span>
        </span>);

        return {
            label: (<span>{contactLabel}</span>),
            searchFields: getSearchFields(currentContact),
            value: currentContact._id,
            onViewDetails: ((onCancel) => viewDetails(onCancel, currentContact)),
        };
    }),
});

export const ContactField = connect(mapStateToProps)(SelectSearchTermsField);
