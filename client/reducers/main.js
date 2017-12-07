import {MAIN} from '../constants';

const initialState = {
    previewItem: null,
    editItem: null,
    filter: MAIN.FILTERS.COMBINED,
};

export default function(state = initialState, action) {
    switch (action.type) {
    case MAIN.ACTIONS.PREVIEW:
        return {...state, previewItem: action.payload || null};

    case MAIN.ACTIONS.EDIT:
        return {...state, editItem: action.payload || null};

    case MAIN.ACTIONS.FILTER:
        return {...state, filter: action.payload || MAIN.FILTERS.COMBINED};

    default:
        return state;
    }
}
