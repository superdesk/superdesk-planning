const session = (state={}, action) => {
    switch (action.type) {
        case 'LOAD_SESSION_DETAILS':
            return action.payload
        default:
            return state
    }
}

export default session
