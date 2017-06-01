const subjects = (state=[], action) => {
    switch (action.type) {
        case 'RECEIVE_SUBJECTS':
            return action.payload
        default:
            return state
    }
}

export default subjects
