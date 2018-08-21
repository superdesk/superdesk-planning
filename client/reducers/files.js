import {get} from 'lodash';

const initialState = {files: {}};

const files = (state = initialState, action) => {
    let files;

    switch (action.type) {
    case 'RECEIVE_FILES':
        files = {...state.files};
        get(action, 'payload', []).forEach((f) => {
            if (get(f, '_id')) {
                files[f._id] = f;
            }
        });
        return {files: files};
    default:
        return state;
    }
};

export default files;
