import {uniqBy} from 'lodash';

const initialState = {contacts: []};

const contacts = (state = initialState, action) => {
    let newState;

    switch (action.type) {
    case 'RECEIVE_CONTACTS':
        newState = {
            contacts: uniqBy([...action.payload.contacts, ...state.contacts], '_id'),
            loading: false,
        };

        if (action.payload.total || action.payload.page) {
            newState.total = action.payload.total;
            newState.page = action.payload.page;
        }

        return newState;

    case 'ADD_CONTACT':
        return {contacts: uniqBy([action.payload, ...state.contacts], '_id')};

    case 'LOADING_CONTACTS':
        return {
            ...state,
            loading: true,
        };

    default:
        return state;
    }
};

export default contacts;
