import React from 'react';
import {connect} from 'react-redux';
import {difference, isEqual} from 'lodash';

import {IContactItem} from '../../interfaces';

import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {ContactMetaData} from './';
import './style.scss';

interface IProps {
    contacts?: {[key: string]: IContactItem};
    contactIds: Array<IContactItem['_id']>;
    scrollInView?: boolean;
    scrollIntoViewOptions: any;
    tabEnabled?: boolean;
    readOnly?: boolean;
    inner?: boolean;

    fetchContacts(ids: Array<IContactItem['_id']>): Promise<IContactItem>;
    onEditContact?(contact: IContactItem): void;
    onRemoveContact?(contact: IContactItem): void;
}

interface IState {
    fetchingContacts: boolean;
    fetchingIds: Array<IContactItem['_id']>;
}

const mapStateToProps = (state) => ({
    contacts: selectors.general.contactsById(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchContacts: (ids) => dispatch(actions.contacts.fetchContactsByIds(ids)),
});

class ContactsPreviewListComponent extends React.Component<IProps, IState> {
    _isMounted: boolean;

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
        const {
            contactIds,
            fetchContacts,
            onEditContact,
            onRemoveContact,
            contacts,
            scrollInView,
            ...props
        } = this.props;

        return (
            <div className="contacts-list__holder">
                {(contactIds || []).map((contactId) => (contacts[contactId] == null ? null : (
                    <ContactMetaData
                        key={contactId}
                        contact={contacts[contactId]}
                        {...props}
                        onEditContact={onEditContact != null ?
                            onEditContact.bind(null, contacts[contactId] || {}) :
                            null
                        }
                        onRemoveContact={onRemoveContact != null ?
                            onRemoveContact.bind(null, contacts[contactId] || {}) :
                            null
                        }
                    />
                )))}
            </div>
        );
    }
}

export const ContactsPreviewList = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContactsPreviewListComponent);
