import { cloneDeep } from 'lodash'
import { PLANNING } from '../constants'

const initialState  = {
    plannings: {},
    currentPlanningId: undefined,
    editorOpened: false,
    planningsAreLoading: false,
    onlyFuture: true,
    filterPlanningKeyword: null,
    onlySpiked: false,
}

/*eslint-disable complexity*/
const planningReducer = (state=initialState, action) => {
    let plannings
    switch (action.type) {
        case PLANNING.ACTIONS.REQUEST_PLANINGS:
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
            action.payload.forEach((planning) => plannings[planning._id] = planning)
            // return new state
            return {
                ...state,
                plannings,
                planningsAreLoading: false,
            }
        case PLANNING.ACTIONS.OPEN_PLANNING_EDITOR:
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: action.payload,
            }
        case PLANNING.ACTIONS.CLOSE_PLANNING_EDITOR:
            return {
                ...state,
                editorOpened: false,
                currentPlanningId: null,
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
        default:
            return state
    }
}
/*eslint-enable*/

export default planningReducer
