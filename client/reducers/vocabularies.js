import { zipObject } from 'lodash'

const initialState = {
    categories: [],
    g2_content_type: [],
    eventoccurstatus: [],
}

const vocabularies = (state=initialState, action) => {
    switch (action.type) {
        case 'RECEIVE_VOCABULARIES':
            return {
                ...initialState,
                ...zipObject(
                    action.payload.map((cv) => cv._id),
                    action.payload.map((cv) => cv.items)
                )
            }
        default:
            return state
    }
}

export default vocabularies
