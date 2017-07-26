const urgency = (state={}, action) => {
    switch (action.type) {
        case 'RECEIVE_URGENCY':
            return action.payload
        default:
            return state
    }
}

export default urgency
