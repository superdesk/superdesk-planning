const initialState = {
    anpaCategories: [],
}

const vocabularies = (state=initialState, action) => {
    switch (action.type) {
        case 'RECEIVE_ANPA_CATEGORIES':
            return { ...state, anpaCategories: action.payload }
        default:
            return state
    }
}

export default vocabularies
