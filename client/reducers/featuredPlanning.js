import {cloneDeep, uniq} from 'lodash';
import {createReducer} from './createReducer';
import {planningUtils} from '../utils';
import {
    FEATURED_PLANNING,
    RESET_STORE,
    INIT_STORE,
} from '../constants';

const initialState = {
    item: null,
    plannings: {},
    planningsInList: [],
    removeList: [],
    featureLockUser: null,
    featureLockSession: null,
    inUse: false,
    currentSearch: null,
    total: null,
    loading: false,
    unsavedItems: null,
};

const featuredPlanningReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [FEATURED_PLANNING.ACTIONS.REQUEST]: (state, payload) => (
        {
            ...state,
            currentSearch: payload,
        }
    ),

    [FEATURED_PLANNING.ACTIONS.RECEIVE_FEATURED_PLANNING_ITEM]: (state, payload) => (
        {
            ...state,
            item: payload,
        }
    ),

    [FEATURED_PLANNING.ACTIONS.SET_LIST]: (state, payload) => (
        {
            ...state,
            planningsInList: payload,
        }
    ),

    [FEATURED_PLANNING.ACTIONS.ADD_TO_LIST]: (state, payload) => (
        featuredPlanningReducer(state, {
            type: FEATURED_PLANNING.ACTIONS.SET_LIST,
            payload: uniq([...state.planningsInList, ...payload]),
        })
    ),

    [FEATURED_PLANNING.ACTIONS.CLEAR_LIST]: (state) => (
        {
            ...state,
            lastRequestParams: {page: 1},
            planningsInList: [],
        }
    ),

    [FEATURED_PLANNING.ACTIONS.RECEIVE_PLANNINGS]: (state, payload) => (
        {
            ...state,
            plannings: planningUtils.modifyPlanningsBeingAdded(state, payload),
        }
    ),

    [FEATURED_PLANNING.ACTIONS.REMOVE_PLANNING]: (state, payload) => {
        let newPlannings = cloneDeep(state.plannings);

        delete newPlannings[payload];
        return {
            ...state,
            plannings: newPlannings,
            planningsInList: state.planningsInList.filter((id) => id !== payload),
        };
    },

    [FEATURED_PLANNING.ACTIONS.LOCKED]: (state, payload) => ({
        ...state,
        featureLockUser: payload.lock_user,
        featureLockSession: payload.lock_session,
    }),

    [FEATURED_PLANNING.ACTIONS.UNLOCKED]: (state, payload) => ({
        ...state,
        featureLockUser: null,
        featureLockSession: null,
    }),

    [FEATURED_PLANNING.ACTIONS.TOTAL]: (state, payload) => ({
        ...state,
        total: payload,
    }),

    [FEATURED_PLANNING.ACTIONS.LOADING_START]: (state, payload) => ({
        ...state,
        item: null,
        loading: true,
        plannings: {},
        planningsInList: [],
        total: null,
        unsavedItems: null,
    }),

    [FEATURED_PLANNING.ACTIONS.LOADING_COMPLETE]: (state, payload) => ({
        ...state,
        loading: false,
    }),

    [FEATURED_PLANNING.ACTIONS.IN_USE]: (state, payload) => (
        {
            ...state,
            inUse: true,
        }
    ),

    [FEATURED_PLANNING.ACTIONS.COMPLETE]: (state, payload) => ({
        ...initialState,
    }),

    [FEATURED_PLANNING.ACTIONS.UNSAVED_ITEMS]: (state, payload) => ({
        ...state,
        unsavedItems: payload,
    }),

    [FEATURED_PLANNING.ACTIONS.SET_REMOVE_LIST]: (state, payload) => ({
        ...state,
        removeList: payload,
    }),
});

export default featuredPlanningReducer;
