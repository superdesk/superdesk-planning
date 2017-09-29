import { INIT_STORE } from '../constants'

const initialState = {
    currentDeskId: null,
    currentStageId: null,
    currentWorkspace: null,
}

const workspace = (state = initialState, action) => {
    switch (action.type) {
        case INIT_STORE:
            return {
                ...state,
                currentWorkspace: action.payload,
            }
        default:
            return state
    }
}

export default workspace
