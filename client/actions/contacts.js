import {get} from 'lodash';

const fetchAllContacts = (ids = []) => (
    (dispatch, getState, {api}) => (
        api('contacts').query({
            max_results: 200,
            page: 1,
            all: true,
            default_operator: 'AND',
            q: 'public:(1) is_active:(1)',
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

const getContact = (id) => (
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
    fetchAllContacts,
    addContact,
    getContact,
};

export default self;
