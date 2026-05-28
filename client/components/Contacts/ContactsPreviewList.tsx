import React from 'react';
import {connect} from 'react-redux';
import {difference, isEqual} from 'lodash';
import {IContact} from 'superdesk-api';
import {ContactMetaData} from './ContactMetaData';
import {Spacer} from 'superdesk-ui-framework/react';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {IContactItem} from 'interfaces';

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
    fetchingIds: Array<IContact['_id']>;
}

const mapStateToProps = (state) => ({
    contacts: selectors.general.contactsById(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchContacts: (ids) => dispatch(actions.contacts.fetchContactsByIds(ids)),
});

class ContactsPreviewListComponent extends React.PureComponent<IProps, IState> {
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
            !isEqual(this.state.fetchingIds, this.props.contactIds)
        );
    }

    fetchContacts() {
        this.setState({
            fetchingContacts: true,
            fetchingIds: this.props.contactIds,
        });

        this.props.fetchContacts(this.props.contactIds)
            .then(this.receiveContacts);
    }

    receiveContacts() {
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

    componentDidUpdate() {
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
            fetchContacts,
            onEditContact,
            onRemoveContact,
            contacts,
            ...props
        } = this.props;

        return (
            <div data-test-id="contacts-preview-list">
                <Spacer v gap="8" justifyContent="center" alignItems="center">
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
                </Spacer>
            </div>
        );
    }
}

export const ContactsPreviewList = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContactsPreviewListComponent);
