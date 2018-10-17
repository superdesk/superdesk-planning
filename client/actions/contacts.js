import {get} from 'lodash';

const getContacts = (searchText, searchFields = []) => (
    (dispatch, getState, {api}) => (api('contacts')
        .query({
            source: {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                default_field: 'first_name',
                                fields: searchFields,
                                query: searchText + '*',
                            },
                        }],
                        should: [
                            {term: {is_active: true}},
                            {term: {public: true}},
                        ],
                    },
                },
            },
        })
    ).then((data) => dispatch(self.receiveContacts(get(data, '_items', []))))
);

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

const getContactById = (id) => (
    (dispatch, getState, {api}) => (
        api('contacts').getById(id)
            .then((contact) => {
                dispatch({
                    type: 'RECEIVE_CONTACTS',
                    payload: [contact],
                });
            })
    )
);

const addContact = (newContact) => ({
    type: 'ADD_CONTACT',
    payload: newContact,
});

const receiveContacts = (contacts) => (
    (dispatch) => {
        if (get(contacts, 'length', 0) > 0) {
            dispatch({
                type: 'RECEIVE_CONTACTS',
                payload: contacts,
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
};

export default self;
