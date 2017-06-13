import { cloneDeep, get } from 'lodash'
import { PLANNING } from '../constants'

const initialState  = {
    plannings: {},
    currentPlanningId: undefined,
    editorOpened: false,
    planningsAreLoading: false,
    onlyFuture: true,
    filterPlanningKeyword: null,
    onlySpiked: false,
    readOnly: true,
}

/*eslint-disable complexity*/
const planningReducer = (state=initialState, action) => {
    let plannings
    let plan
    let index
    switch (action.type) {
        case PLANNING.ACTIONS.REQUEST_PLANNINGS:
            return {
                ...state,
                planningsAreLoading: true,
            }
        case PLANNING.ACTIONS.PLANNING_FILTER_BY_KEYWORD:
            return {
                ...state,
                filterPlanningKeyword: action.payload,
            }
        case PLANNING.ACTIONS.RECEIVE_PLANNINGS:
            // payload must be an array. If not, we transform
            action.payload = Array.isArray(action.payload) ? action.payload : [action.payload]
            // clone plannings
            plannings = cloneDeep(state.plannings)
            // add to state.plannings, use _id as key
            action.payload.forEach((planning) => {
                // Make sure that the Planning item has the coverages array
                planning.coverages = get(planning, 'coverages', [])
                plannings[planning._id] = planning
            })
            // return new state
            return {
                ...state,
                plannings,
                planningsAreLoading: false,
            }
        case PLANNING.ACTIONS.PREVIEW_PLANNING:
            if (!state.currentPlanningId || state.currentPlanningId !== action.payload) {
                return {
                    ...state,
                    editorOpened: true,
                    currentPlanningId: action.payload,
                    readOnly: true,
                }
            } else {
                return state
            }

        case PLANNING.ACTIONS.OPEN_PLANNING_EDITOR:
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: action.payload,
                readOnly: false,
            }
        case PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR:
            return {
                ...state,
                editorOpened: false,
                currentPlanningId: null,
                readOnly: true,
            }
        case PLANNING.ACTIONS.SET_ONLY_FUTURE:
            return {
                ...state,
                onlyFuture: action.payload,
            }
        case PLANNING.ACTIONS.SET_ONLY_SPIKED:
            return {
                ...state,
                onlySpiked: action.payload,
            }
        case PLANNING.ACTIONS.RECEIVE_COVERAGE:
            plannings = cloneDeep(state.plannings)
            plan = get(plannings, action.payload.planning_item, null)

            // If the planning item is not loaded, disregard this action
            if (plan === null) return state

            // Either add or update the coverage item
            index = plan.coverages.findIndex((c) => c._id === action.payload._id)
            if (index === -1) {
                plan.coverages.push(action.payload)
            } else {
                plan.coverages.splice(index, 1, action.payload)
            }

            return {
                ...state,
                plannings,
            }
        case PLANNING.ACTIONS.COVERAGE_DELETED:
            plannings = cloneDeep(state.plannings)
            plan = get(plannings, action.payload.planning_item, null)

            // If the planning item is not loaded, disregard this action
            if (plan === null) return state

            // Remove the coverage from the planning item
            index = plan.coverages.findIndex((c) => c._id === action.payload._id)
            if (index === -1) return state

            plan.coverages.splice(index, 1)
            return {
                ...state,
                plannings,
            }
        default:
            return state
    }
}
/*eslint-enable*/

export default planningReducer
