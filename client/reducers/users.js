const initialState = { users: [] }

const users = (state=initialState, action) => {
    switch (action.type) {
        case 'RECEIVE_USERS':
            return action.payload
        default:
            return state
    }
}

export default users
