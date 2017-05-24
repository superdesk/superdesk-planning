const initialState = { desks: [] }

const desks = (state=initialState, action) => {
    switch (action.type) {
        case 'RECEIVE_DESKS':
            return action.payload
        default:
            return state
    }
}

export default desks
