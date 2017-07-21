const genres = (state=[], action) => {
    switch (action.type) {
        case 'RECEIVE_GENRES':
            return action.payload
        default:
            return state
    }
}

export default genres
