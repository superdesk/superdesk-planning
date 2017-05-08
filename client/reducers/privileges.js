
const privileges = (state={}, action) => {
    switch (action.type) {
        case 'RECEIVE_PRIVILEGES':
            return action.payload
        default:
            return state
    }
}

export default privileges
