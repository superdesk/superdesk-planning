import { cloneDeep } from 'lodash'

const initialState  = {
    plannings: {},
    currentPlanningId: undefined,
    editorOpened: false,
    planningsAreLoading: false,
    onlyFuture: true,
    filterPlanningKeyword: null,
}

/*eslint-disable complexity*/
const planningReducer = (state=initialState, action) => {
    let plannings
    switch (action.type) {
        case 'REQUEST_PLANINGS':
            return {
                ...state,
                planningsAreLoading: true,
            }
        case 'PLANNING_FILTER_BY_KEYWORD':
            return {
                ...state,
                filterPlanningKeyword: action.payload,
            }
        case 'RECEIVE_PLANNINGS':
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
        case 'DELETE_PLANNING':
            // Clone the list of current planning items
            plannings = cloneDeep(state.plannings)
            delete plannings[action.payload]
            return {
                ...state,
                plannings,
            }
        case 'OPEN_PLANNING_EDITOR':
            return {
                ...state,
                editorOpened: true,
                currentPlanningId: action.payload,
            }
        case 'CLOSE_PLANNING_EDITOR':
            return {
                ...state,
                editorOpened: false,
                currentPlanningId: null,
            }
        case 'SET_ONLY_FUTURE':
            return {
                ...state,
                onlyFuture: action.payload,
            }
        default:
            return state
    }
}
/*eslint-enable*/

export default planningReducer
