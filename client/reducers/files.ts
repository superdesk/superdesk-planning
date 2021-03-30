import {get} from 'lodash';

const initialState = {files: {}};

const files = (state = initialState, action) => {
    let files = {...state.files};

    switch (action.type) {
    case 'RECEIVE_FILES':
        get(action, 'payload', []).forEach((f) => {
            if (get(f, '_id')) {
                files[f._id] = f;
            }
        });
        return {files: files};

    case 'REMOVE_FILE':
        delete files[action.payload];
        return {files: files};
    default:
        return state;
    }
};

export default files;
