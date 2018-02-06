import {MAIN, RESET_STORE} from '../constants';
import {cloneDeep, get, omit} from 'lodash';

const search = {
    lastRequestParams: {page: 1},
    fulltext: undefined,
    currentSearch: undefined,
    totalItems: 0
};

const initialState = {
    previewItem: null,
    filter: null,
    search: {
        [MAIN.FILTERS.EVENTS]: cloneDeep(search),
        [MAIN.FILTERS.PLANNING]: cloneDeep(search),
        [MAIN.FILTERS.COMBINED]: cloneDeep(search)
    }
};

const modifyParams = (state, action) => {
    let params = cloneDeep(state.search) || {};

    Object.keys(action.payload).forEach((key) => {
        const payloadParam = get(action.payload, key, {});

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

export default function(state = initialState, action) {
    switch (action.type) {
    case RESET_STORE:
        return {
            ...state,
            previewItem: null,
        };
    case MAIN.ACTIONS.PREVIEW:
        return {...state, previewItem: action.payload || null};

    case MAIN.ACTIONS.FILTER:
        return {...state, filter: action.payload || MAIN.FILTERS.COMBINED};

    case MAIN.ACTIONS.CLOSE_PREVIEW:
        return {...state, previewItem: null};

    case MAIN.ACTIONS.REQUEST:
        return {
            ...state,
            search: modifyParams(state, action)
        };
    case MAIN.ACTIONS.SET_TOTAL:
        return {
            ...state,
            search: {
                ...state.search,
                [action.payload.filter]: {
                    ...state.search[action.payload.filter],
                    totalItems: action.payload.total || 0
                }
            }
        };
    case MAIN.ACTIONS.CLEAR_SEARCH:
        return {
            ...state,
            search: {
                ...state.search,
                [action.payload]: cloneDeep(search)
            }
        };
    default:
        return state;
    }
}
