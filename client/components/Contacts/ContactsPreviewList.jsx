import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {difference, isEqual} from 'lodash';

import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {ContactMetaData} from './';

class ContactsPreviewListComponent extends React.Component {
    constructor(props) {
        super(props);

        this._isMounted = false;

        this.state = {
            fetchingContacts: false,
            fetchingIds: [],
        };

        this.fetchContactsRequired = this.fetchContactsRequired.bind(this);
        this.fetchContacts = this.fetchContacts.bind(this);
        this.receiveContacts = this.receiveContacts.bind(this);
    }

    fetchContactsRequired() {
        return (
            !this.state.fetchingContacts &&
            difference(
                this.props.contactIds || [],
                Object.keys(this.props.contacts || {})
            ).length > 0
        ) || !isEqual(this.state.fetchingIds, this.props.contactIds);
    }

    fetchContacts() {
        this.setState({
            fetchingContacts: true,
            fetchingIds: this.props.contactIds,
        });

        this.props.fetchContacts(this.props.contactIds)
            .then(this.receiveContacts);
    }

    receiveContacts(contacts) {
        // This component may have been unmounted while fetching the data
        // So only update the state if this is still mounted
        if (this._isMounted) {
            this.setState({
                fetchingContacts: false,
            });
        }
    }

    componentDidMount() {
        this._isMounted = true;
        if (this.fetchContactsRequired()) {
            this.fetchContacts();
        }
    }

    componentDidUpdate(prevProps) {
        if (this.fetchContactsRequired()) {
            this.fetchContacts();
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        // eslint-disable-next-line no-unused-vars
        const {contactIds, fetchContacts, onEditContact, onRemoveContact, contacts, ...props} = this.props;
        const {fetchingContacts} = this.state;

        return (
            <div>
                {contactIds.map((contactId) => (
                    <ContactMetaData
                        key={contactId}
                        contact={contacts[contactId] || {}}
                        fetchingContacts={fetchingContacts}

                        {...props}

                        onEditContact={onEditContact ? onEditContact.bind(null, contacts[contactId] || {}) : null}
                        onRemoveContact={onRemoveContact ? onRemoveContact.bind(null, contacts[contactId] || {}) : null}
                    />
                ))}
            </div>
        );
    }
}

ContactsPreviewListComponent.propTypes = {
    contacts: PropTypes.object,
    contactIds: PropTypes.array,
    fetchContacts: PropTypes.func,
    onEditContact: PropTypes.func,
    onRemoveContact: PropTypes.func,

    scrollInView: PropTypes.bool,
    scrollIntoViewOptions: PropTypes.object,
    tabEnabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    inner: PropTypes.bool,
};

ContactsPreviewListComponent.defaultProps = {
    contactIds: [],
    scrollInView: true,
    readOnly: false,
    inner: false,
};

const mapStateToProps = (state) => ({
    contacts: selectors.general.contactsById(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchContacts: (ids) => dispatch(actions.contacts.fetchContactsByIds(ids)),
});

export const ContactsPreviewList = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContactsPreviewListComponent);
