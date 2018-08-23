import {uniqBy} from 'lodash';

const initialState = {contacts: []};

const contacts = (state = initialState, action) => {
    switch (action.type) {
    case 'RECEIVE_CONTACTS':
        return {contacts: uniqBy([...action.payload, ...state.contacts], '_id')};

    case 'ADD_CONTACT':
        return {contacts: uniqBy([...state.contacts, action.payload], '_id')};

    default:
        return state;
    }
};

export default contacts;
