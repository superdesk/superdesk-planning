import {
    PREVIEW,
    EDIT,
} from '../actions/main';

const initialState = {
    previewItem: null,
    editItem: null,
};

export default function(state=initialState, action) {
    switch (action.type) {

    case PREVIEW:
        return {...state, previewItem: action.item || null};

    case EDIT:
        return {...state, editItem: action.item || null};

    default:
        return state;
    }
}
