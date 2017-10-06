const initialState = {
    workspace: {
        currentDeskId: undefined,
        currentStageId: undefined,
    },
}

const workspace = (state=initialState, action) => {
    switch (action.type) {
        case 'WORKSPACE_CHANGE':
            return {
                ...state,
                ...action.payload,
            }
        default:
            return state
    }
}

export default workspace
