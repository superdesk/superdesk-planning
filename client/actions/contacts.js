import {get} from 'lodash';

const getContacts = (searchText, searchFields = []) => (
    (dispatch, getState, {api}) => api('contacts')
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
);

const getEventContacts = (event) => (
    (dispatch, getState, {api}) => (
        api('contacts').query({
            source: {
                query: {
                    terms: {
                        _id: get(event, 'event_contact_info', []),
                    },
                },
            },
        })
            .then((data) => {
                if (get(data, '_items.length') > 0) {
                    dispatch({
                        type: 'RECEIVE_CONTACTS',
                        payload: get(data, '_items'),
                    });
                }
                return Promise.resolve();
            })
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

// eslint-disable-next-line consistent-this
const self = {
    getEventContacts,
    addContact,
    getContacts,
    getContactById,
};

export default self;
