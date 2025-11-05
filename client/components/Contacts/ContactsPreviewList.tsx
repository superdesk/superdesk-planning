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
        const {contactIds, contacts} = this.props;
        const {fetchingContacts, fetchingIds} = this.state;

        if (fetchingContacts) {
            return false;
        }

        // If IDs changed in value or length, check if new IDs need fetching
        const newIds = contactIds.filter((id) => !(id in contacts));

        if (newIds.length > 0 && !isEqual(fetchingIds.sort(), contactIds.sort())) {
            return true;
        }

        return false;
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
        const {
            contactIds,
            contacts,
            onEditContact,
            onRemoveContact,
            ...props
        } = this.props;

        const normalizeId = (id: string) => id?.replace('urn:belga:contact:', '');

        return (
            <div className="contacts-list__holder">
                {(contactIds || []).map((contactId) => {
                    const normalizedId = normalizeId(contactId);
                    const contact = contacts[contactId] || contacts[normalizedId];

                    if (!contact) {
                        return null;
                    }

                    return (
                        <ContactMetaData
                            key={contactId}
                            contact={contact}
                            {...props}
                            onEditContact={onEditContact?.bind(null, contact)}
                            onRemoveContact={onRemoveContact?.bind(null, contact)}
                        />
                    );
                })}
            </div>
        );
    }
}

export const ContactsPreviewList = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContactsPreviewListComponent);
