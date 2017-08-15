import { uniqBy, uniq } from 'lodash'
import { RESET_STORE, INIT_STORE } from '../constants'

const initialState = {
    desk: '',
    user: '',
    assignments: [],
    filterByUser: true,
    selectedAssignments: [],
}

const assignment = (state = initialState, action) => {
    switch (action.type) {
        case RESET_STORE:
            return null
        case INIT_STORE:
            return initialState
        case 'RECEIVED_ASSIGNMENTS':
            return {
                ...state,
                assignments: action.payload,
            }
        case 'RECEIVED_MORE_ASSIGNMENTS':
            return {
                ...state,
                assignments: uniqBy(
                    [...state.assignments, ...action.payload],
                    '_id'
                ),
            }
        case 'CHANGE_LIST_SETTINGS':
            return {
                ...state,
                ...action.payload,
            }
        case 'SELECT_ASSIGNMENTS':
            return {
                ...state,
                selectedAssignments: uniq(
                    [...state.selectedAssignments, ...action.payload]
                ),
            }
        case 'DESELECT_ASSIGNMENT':
            return {
                ...state,
                selectedAssignments: state.selectedAssignments.filter((e) => e !== action.payload),
            }
        default:
            return state
    }
}

export default assignment
