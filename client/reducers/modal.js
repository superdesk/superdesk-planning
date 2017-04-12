const initialState = {
    modalType: null,
    modalProps: undefined,
    previousState: undefined,
}

const modal = (state = initialState, action) => {
    switch (action.type) {
        case 'SHOW_MODAL':
            return {
                modalType: action.modalType,
                modalProps: action.modalProps,
                previousState: state,
            }
        case 'HIDE_MODAL':
            return state.previousState || initialState
        default:
            return state
    }
}

export default modal
