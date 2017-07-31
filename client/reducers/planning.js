import { cloneDeep, get, uniq } from 'lodash'
import { PLANNING } from '../constants'
import { createReducer } from '../utils'
import moment from 'moment'

const initialState  = {
    plannings: {},
    planningsInList: [],
    currentPlanningId: undefined,
    editorOpened: false,
    planningsAreLoading: false,
    onlyFuture: true,
    filterPlanningKeyword: null,
    onlySpiked: false,
    readOnly: true,
    planningHistoryItems: [],
    lastRequestParams: { page: 1 },
    search: { currentSearch: undefined },
}

let plannings
let plan
let index

const modifyPlanningsBeingAdded = (state, payload) => {
    // payload must be an array. If not, we transform
    payload = Array.isArray(payload) ? payload : [payload]
    // clone plannings
    plannings = cloneDeep(state.plannings)
    // add to state.plannings, use _id as key
    payload.forEach((planning) => {
        // Make sure that the Planning item has the coverages array
        planning.coverages = get(planning, 'coverages', [])
        modifyCoveragesForPlanning(planning)
        plannings[planning._id] = planning
    })
}

const modifyCoveragesForPlanning = (planning) => {
    // As with events, change the coverage dates to moment objects
    planning.coverages.forEach((cov) => {
        if (get(cov, 'planning.scheduled')) {
            cov.planning.scheduled = moment(cov.planning.scheduled)
        }
    })
}

const planningReducer = createReducer(initialState, {
    [PLANNING.ACTIONS.SET_LIST]: (state, payload) => (
        {
            ...state,
            planningsInList: payload,
        }
    ),

    [PLANNING.ACTIONS.ADD_TO_LIST]: (state, payload) => (
        planningReducer(state, {
            type: PLANNING.ACTIONS.SET_LIST,
            payload: uniq([...state.planningsInList, ...payload]),
        })
    ),

    [PLANNING.ACTIONS.CLEAR_LIST]: (state) => (
        {
            ...state,
            lastRequestParams: { page: 1 },
            planningsInList: [],
        }
    ),

    [PLANNING.ACTIONS.REQUEST_PLANNINGS]: (state, payload) => (
        {
            ...state,
            planningsAreLoading: true,
            lastRequestParams: payload,
        }
    ),

    [PLANNING.ACTIONS.PLANNING_FILTER_BY_KEYWORD]: (state, payload) => (
        {
            ...state,
            filterPlanningKeyword: payload,
        }
    ),

    [PLANNING.ACTIONS.RECEIVE_PLANNINGS]: (state, payload) => {
        modifyPlanningsBeingAdded(state, payload)
        // return new state
        return {
            ...state,
            plannings,
            planningsAreLoading: false,
        }
    },

    [PLANNING.ACTIONS.PREVIEW_PLANNING]: (state, payload) => {
        if (!state.currentPlanningId || state.currentPlanningId !== payload) {
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: payload,
                readOnly: true,
            }
        } else {
            return state
        }
    },

    [PLANNING.ACTIONS.OPEN_PLANNING_EDITOR]: (state, payload) => {
        if (payload.lock_user) {
            // clone plannings
            plannings = cloneDeep(state.plannings)
            plannings[payload._id] = payload
            // return new state with the lock information
            return {
                ...state,
                plannings,
                editorOpened: true,
                currentPlanningId: payload._id,
                readOnly: false,
            }
        } else if (payload._id) {
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: payload._id,
                readOnly: false,
            }
        } else {
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: payload,
                readOnly: false,
            }
        }
    },

    [PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR]: (state) => (
        {
            ...state,
            editorOpened: false,
            currentPlanningId: null,
        }
    ),

    [PLANNING.ACTIONS.SET_ONLY_FUTURE]: (state, payload) => (
        {
            ...state,
            onlyFuture: payload,
            search: {
                ...state.search,
                currentSearch: payload,
            },
        }
    ),

    [PLANNING.ACTIONS.SET_ONLY_SPIKED]: (state, payload) => (
        {
            ...state,
            onlySpiked: payload,
        }
    ),

    [PLANNING.ACTIONS.RECEIVE_COVERAGE]: (state, payload) => {
        plannings = cloneDeep(state.plannings)
        plan = get(plannings, payload.planning_item, null)

        // If the planning item is not loaded, disregard this action
        if (plan === null) return state

        // Either add or update the coverage item
        index = plan.coverages.findIndex((c) => c._id === payload._id)
        if (index === -1) {
            plan.coverages.push(payload)
        } else {
            plan.coverages.splice(index, 1, payload)
        }

        modifyCoveragesForPlanning(plan)

        return {
            ...state,
            plannings,
        }
    },

    [PLANNING.ACTIONS.COVERAGE_DELETED]: (state, payload) => {
        plannings = cloneDeep(state.plannings)
        plan = get(plannings, payload.planning_item, null)

        // If the planning item is not loaded, disregard this action
        if (plan === null) return state

        // Remove the coverage from the planning item
        index = plan.coverages.findIndex((c) => c._id === payload._id)
        if (index === -1) return state

        plan.coverages.splice(index, 1)
        return {
            ...state,
            plannings,
        }
    },

    [PLANNING.ACTIONS.RECEIVE_PLANNING_HISTORY]: (state, payload) => ({
        ...state,
        planningHistoryItems: payload,
    }),
})

export default planningReducer
