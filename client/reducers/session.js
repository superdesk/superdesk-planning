const initialState = {
    sessionId: null,
    identity: null,
};

const session = (state = initialState, action) => {
    switch (action.type) {
    case 'RECEIVE_SESSION':
        return action.payload;
    default:
        return state;
    }
};

export default session;
