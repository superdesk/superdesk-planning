import { uniqBy, uniq } from 'lodash'
import { ASSIGNMENTS, RESET_STORE, INIT_STORE } from '../constants'
import { createReducer } from '../utils'

const initialState = {
    assignments: [],
    filterBy: 'All',
    selectedAssignments: [],
    previewOpened: false,
}

const assignmentReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [ASSIGNMENTS.ACTIONS.RECEIVED_ASSIGNMENTS]: (state, payload) => (
        {
            ...state,
            assignments: payload,
        }
    ),

    [ASSIGNMENTS.ACTIONS.RECEIVED_MORE_ASSIGNMENTS]: (state, payload) => (
        {
            ...state,
            assignments: uniqBy(
                [...state.assignments, ...payload],
                '_id'
            ),
        }
    ),

    [ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS]: (state, payload) => (
        {
            ...state,
            ...payload,
        }
    ),

    [ASSIGNMENTS.ACTIONS.SELECT_ASSIGNMENTS]: (state, payload) => (
        {
            ...state,
            selectedAssignments: uniq(
                [...state.selectedAssignments, ...payload]
            ),
        }
    ),

    [ASSIGNMENTS.ACTIONS.DESELECT_ASSIGNMENT]: (state, payload) => (
        {
            ...state,
            selectedAssignments: state.selectedAssignments.filter((e) => e !== payload),
        }
    ),

    [ASSIGNMENTS.ACTIONS.PREVIEW_ASSIGNMENT]: (state, payload) => (
        {
            ...state,
            previewOpened: true,
            currentAssignment: payload,
            readOnly: true,
        }
    ),

    [ASSIGNMENTS.ACTIONS.CLOSE_PREVIEW_ASSIGNMENT]: (state) => (
        {
            ...state,
            previewOpened: false,
            currentAssignment: null,
        }
    ),
})

export default assignmentReducer
