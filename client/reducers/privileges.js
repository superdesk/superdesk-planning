import { PRIVILEGES } from '../constants'

const privileges = (state={}, action) => {
    switch (action.type) {
        case PRIVILEGES.ACTIONS.RECEIVE_PRIVILEGES:
            return action.payload
        default:
            return state
    }
}

export default privileges
