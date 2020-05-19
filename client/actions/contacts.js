import {get} from 'lodash';
import * as selectors from '../selectors';

/**
 * Sends a query to the API to retrieve the list of contacts
 * @param {string} searchText - The text search for the query
 * @param {Array<string>} searchFields - The fields to use for the text search
 * @param {string} contactType - Limit the query to a particular contact type
 * @returns {Array<Object>} Returns an array of contacts found
 */
const getContacts = (searchText, searchFields = [], contactType = '', page = 1) => (
    (dispatch, getState, {api}) => {
        const bool = {
            must: [],
            should: [
                {term: {is_active: true}},
                {term: {public: true}},
            ],
        };

        if (searchText) {
            bool.must.push({
                query_string: {
                    fields: searchFields,
                    query: searchText + '*',
                    default_operator: 'AND',
                },
            });
        }

        if (contactType) {
            bool.must.push({term: {contact_type: contactType}});
        }

        dispatch({type: 'LOADING_CONTACTS'});

        return api('contacts').query({
            source: {query: {bool: bool}},
            sort: '[("first_name.keyword", 1)]',
            max_results: 200,
            page: page,
        })
            .then(
                (data) => dispatch(
                    self.receiveContacts(
                        get(data, '_items', []),
                        get(data, '_meta.total'),
                        get(data, '_meta.page')

                    )
                )
            );
    }
);

/**
 * Fetch contacts by id
 * @param {Array<string>} ids - The IDs of the contacts to load
 * @returns {Array<Object>} Returns an array of the contacts
 */
const fetchContactsByIds = (ids) => (
    (dispatch, getState, {api}) => (
        api('contacts').query({
            source: {query: {terms: {_id: ids}}},
            all: true,
        }
        )
            .then((data) => dispatch(self.receiveContacts(get(data, '_items', []))))
    )
);

/**
 * Fetch contacts from an array of assignments
 * @param {Array<Object>} assignments - Array of assignment objects
 * @returns {Array<Object>} Returns an array of the contacts found
 */
const fetchContactsFromAssignments = (assignments) => (
    (dispatch, getState) => {
        if (!assignments || assignments.length === 0) {
            return Promise.resolve([]);
        }

        const loadedContactIds = selectors.general.contactIds(getState());
        let contactsToLoad = new Set();

        assignments.forEach((item) => {
            const contactId = get(item, 'assigned_to.contact');

            if (contactId && !loadedContactIds.includes(contactId)) {
                contactsToLoad.add(item.assigned_to.contact);
            }
        });

        if (contactsToLoad.size === 0) {
            return Promise.resolve([]);
        }

        return dispatch(self.fetchContactsByIds(Array.from(contactsToLoad)));
    }
);

/**
 * Fetch contacts from an array of assignments
 * @param {Array<Object>} plannings - Array of planning objects
 * @returns {Array<Object>} Returns an array of the contacts found
 */
const fetchContactsFromPlanning = (plannings) => (
    (dispatch, getState) => {
        if (!plannings || plannings.length === 0) {
            return Promise.resolve([]);
        }

        const loadedContactIds = selectors.general.contactIds(getState());
        let contactsToLoad = new Set();

        plannings.forEach((item) => {
            if (!item || !item.coverages || item.coverages.length === 0) {
                return;
            }

            item.coverages
                .map((coverage) => coverage && coverage.assigned_to && coverage.assigned_to.contact)
                .filter((contactId) =>
                    contactId &&
                    !loadedContactIds.includes(contactId)
                )
                .forEach((contactId) => {
                    contactsToLoad.add(contactId);
                });
        });

        if (contactsToLoad.size === 0) {
            return Promise.resolve([]);
        }

        return dispatch(self.fetchContactsByIds(Array.from(contactsToLoad)));
    }
);

/**
 * Retrieve a single contact by its ID
 * @param {string} id - The ID of the contact
 * @returns {Object} Returns the contact found
 */
const getContactById = (id) => (
    (dispatch, getState, {api}) => (
        api('contacts').getById(id)
            .then((contact) => {
                dispatch(self.receiveContacts([contact]));

                return contact;
            })
    )
);

/**
 * Add a contact to the store
 * @param {Object} newContact - The new contact to add
 */
const addContact = (newContact) => ({
    type: 'ADD_CONTACT',
    payload: newContact,
});

/**
 * Receive contacts and place them in the store
 * @param {Array<Object>} contacts - The contacts to add to the store
 * @returns {Array<Object>} Returns an array of the contacts provided
 */
const receiveContacts = (contacts, total, page) => (
    (dispatch) => {
        if (get(contacts, 'length', 0) > 0) {
            dispatch({
                type: 'RECEIVE_CONTACTS',
                payload: {
                    contacts,
                    total,
                    page,
                },
            });
        }
        return Promise.resolve(contacts);
    }
);

// eslint-disable-next-line consistent-this
const self = {
    fetchContactsByIds,
    addContact,
    getContacts,
    getContactById,
    receiveContacts,
    fetchContactsFromPlanning,
    fetchContactsFromAssignments,
};

export default self;
