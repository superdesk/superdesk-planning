import {MAIN, RESET_STORE} from '../constants';
import {cloneDeep, get, omit} from 'lodash';
import {createReducer} from '../utils';

const search = {
    lastRequestParams: {page: 1},
    fulltext: undefined,
    currentSearch: undefined,
    totalItems: 0
};

const initialState = {
    previewId: null,
    previewType: null,
    loadingPreview: false,
    filter: null,
    search: {
        [MAIN.FILTERS.EVENTS]: cloneDeep(search),
        [MAIN.FILTERS.PLANNING]: cloneDeep(search),
        [MAIN.FILTERS.COMBINED]: cloneDeep(search)
    },
    loadingIndicator: false
};

const modifyParams = (state, payload) => {
    let params = cloneDeep(state.search) || {};

    Object.keys(payload).forEach((key) => {
        const payloadParam = get(payload, key, {});

        params[key] = {
            ...params[key],
            currentSearch: {
                ...omit(payloadParam, ['fulltext', 'page'])
            },
            fulltext: payloadParam.fulltext
        };

        params[key].lastRequestParams = {
            ...search.lastRequestParams,
            ...payloadParam
        };
    });

    return params;
};

export default createReducer(initialState, {
    [RESET_STORE]: (state) => ({
        ...state,
        previewItem: null,
    }),
    [MAIN.ACTIONS.PREVIEW]: (state, payload) => ({
        ...state,
        previewItem: payload || null
    }),

    [MAIN.ACTIONS.FILTER]: (state, payload) => ({
        ...state,
        filter: payload || MAIN.FILTERS.COMBINED
    }),

    [MAIN.ACTIONS.CLOSE_PREVIEW]: (state) => ({
        ...state,
        previewItem: null,
        previewId: null,
        previewType: null
    }),

    [MAIN.ACTIONS.REQUEST]: (state, payload) => ({
        ...state,
        search: modifyParams(state, payload)
    }),

    [MAIN.ACTIONS.SET_TOTAL]: (state, payload) => ({
        ...state,
        search: {
            ...state.search,
            [payload.filter]: {
                ...state.search[payload.filter],
                totalItems: payload.total || 0
            }
        }
    }),

    [MAIN.ACTIONS.SET_UNSET_LOADING_INDICATOR]: (state, payload) => ({
        ...state,
        loadingIndicator: payload
    }),

    [MAIN.ACTIONS.CLEAR_SEARCH]: (state, payload) => ({
        ...state,
        search: {
            ...state.search,
            [payload]: cloneDeep(search)
        }
    }),

    [MAIN.ACTIONS.SET_PREVIEW_ITEM]: (state, payload) => ({
        ...state,
        previewId: payload.itemId,
        previewType: payload.itemType
    }),

    [MAIN.ACTIONS.PREVIEW_LOADING_START]: (state) => ({
        ...state,
        loadingPreview: true,
    }),

    [MAIN.ACTIONS.PREVIEW_LOADING_COMPLETE]: (state) => ({
        ...state,
        loadingPreview: false,
    }),
});
