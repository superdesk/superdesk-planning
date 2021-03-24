import {USER_ACTIONS} from '../constants';

const initialState = {
    sessionId: null,
    identity: null,
    userPreferences: {},
};

const session = (state = initialState, action) => {
    switch (action.type) {
    case 'RECEIVE_SESSION':
        return action.payload;
    case USER_ACTIONS.RECEIVE_USER_PREFERENCES:
        return {
            ...state,
            userPreferences: action.payload,
        };
    default:
        return state;
    }
};

export default session;
