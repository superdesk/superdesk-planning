import {MAIN, RESET_STORE} from '../constants';
import {cloneDeep, get, omit, set} from 'lodash';
import {createReducer} from '../utils';

const search = {
    lastRequestParams: {page: 1},
    fulltext: undefined,
    currentSearch: undefined,
    totalItems: 0,
    jumpInterval: MAIN.JUMP.WEEK,
};

const initialState = {
    previewId: null,
    previewType: null,
    loadingPreview: false,
    filter: null,
    search: {
        [MAIN.FILTERS.EVENTS]: cloneDeep(search),
        [MAIN.FILTERS.PLANNING]: cloneDeep(search),
        [MAIN.FILTERS.COMBINED]: cloneDeep(search),
    },
    loadingIndicator: false,
};

const modifyParams = (state, payload) => {
    let params = cloneDeep(state.search) || {};

    Object.keys(payload).forEach((key) => {
        const payloadParam = get(payload, key, {});

        params[key] = {
            ...params[key],
            currentSearch: {
                ...omit(payloadParam, ['fulltext', 'page']),
            },
            fulltext: payloadParam.fulltext,
        };

        params[key].lastRequestParams = {
            ...search.lastRequestParams,
            ...payloadParam,
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
        previewItem: payload || null,
    }),

    [MAIN.ACTIONS.FILTER]: (state, payload) => ({
        ...state,
        filter: payload || MAIN.FILTERS.COMBINED,
    }),

    [MAIN.ACTIONS.CLOSE_PREVIEW]: (state) => ({
        ...state,
        previewItem: null,
        previewId: null,
        previewType: null,
    }),

    [MAIN.ACTIONS.REQUEST]: (state, payload) => ({
        ...state,
        search: modifyParams(state, payload),
    }),

    [MAIN.ACTIONS.SET_TOTAL]: (state, payload) => ({
        ...state,
        search: {
            ...state.search,
            [payload.filter]: {
                ...state.search[payload.filter],
                totalItems: payload.total || 0,
            },
        },
    }),

    [MAIN.ACTIONS.SET_UNSET_LOADING_INDICATOR]: (state, payload) => ({
        ...state,
        loadingIndicator: payload,
    }),

    [MAIN.ACTIONS.CLEAR_SEARCH]: (state, payload) => {
        let newState = {
            ...state,
            search: {
                ...state.search,
                [payload]: cloneDeep(search),
            },
        };

        if (get(state.search[payload], 'currentSearch.excludeRescheduledAndCancelled')) {
            newState.search[payload].currentSearch = {excludeRescheduledAndCancelled: true};
        }

        return newState;
    },

    [MAIN.ACTIONS.SET_PREVIEW_ITEM]: (state, payload) => ({
        ...state,
        previewId: payload.itemId,
        previewType: payload.itemType,
    }),

    [MAIN.ACTIONS.PREVIEW_LOADING_START]: (state) => ({
        ...state,
        loadingPreview: true,
    }),

    [MAIN.ACTIONS.PREVIEW_LOADING_COMPLETE]: (state) => ({
        ...state,
        loadingPreview: false,
    }),

    [MAIN.ACTIONS.SET_JUMP_INTERVAL]: (state, payload) => ({
        ...state,
        search: {
            ...state.search,
            [state.filter]: {
                ...state.search[state.filter],
                jumpInterval: payload,
            },
        },
    }),

    [MAIN.ACTIONS.JUMP_TO]: (state, payload) => {
        const search = cloneDeep(get(state, `search.${state.filter}`));

        // Remove the time values from the jump
        if (payload) {
            payload.set({hour: 0, minute: 0, second: 0, millisecond: 0});
        }


        set(search, 'currentSearch.advancedSearch.dates.start', payload);
        set(search, 'currentSearch.advancedSearch.dates.range', '');

        return {
            ...state,
            search: {
                ...state.search,
                [state.filter]: search,
            },
        };
    },
});
