import {createReducer} from './createReducer';
import {MAIN, RESET_STORE} from '../constants';

const initialState = {preview: null};

export default createReducer(initialState, {
    [RESET_STORE]: (state) => ({
        ...initialState,
    }),
    [MAIN.ACTIONS.CLOSE_PREVIEW]: (state) => ({
        ...initialState,
    }),
    [MAIN.ACTIONS.SET_PUBLISH_QUEUE_ITEM]: (state, payload) => ({
        ...initialState,
        preview: payload,
    }),
});