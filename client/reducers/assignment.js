import { uniq, keyBy, get } from 'lodash'
import { ASSIGNMENTS, RESET_STORE, INIT_STORE } from '../constants'
import moment from 'moment'
import { createReducer } from '../utils'

const initialState = {
    assignments: {},
    filterBy: 'All',
    selectedAssignments: [],
    previewOpened: false,
    assignmentsInList: [],
    currentAssignmentId: null,
}

const modifyAssignmentBeingAdded = (payload) => {
    // payload must be an array. If not, we transform
    payload = Array.isArray(payload) ? payload : [payload]
    payload.forEach((assignment) => {
        if (get(assignment, 'planning.scheduled')) {
            assignment.planning.scheduled = moment(assignment.planning.scheduled)
        }
    })
    return keyBy(payload, '_id')
}

const assignmentReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [ASSIGNMENTS.ACTIONS.RECEIVED_ASSIGNMENTS]: (state, payload) => {
        let receivedAssignments = modifyAssignmentBeingAdded(payload)
        return {
            ...state,
            assignments: {
                ...state.assignments,
                ...receivedAssignments,
            },
        }
    },

    [ASSIGNMENTS.ACTIONS.SET_ASSIGNMENTS_LIST]: (state, payload) => (
        {
            ...state,
            assignmentsInList: payload || [],
        }
    ),

    [ASSIGNMENTS.ACTIONS.ADD_TO_ASSIGNMENTS_LIST]: (state, payload) => (
        assignmentReducer(state, {
            type: ASSIGNMENTS.ACTIONS.SET_ASSIGNMENTS_LIST,
            payload: uniq([...state.assignmentsInList, ...payload]),
        })
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
            currentAssignmentId: get(payload, '_id') || payload,
            readOnly: true,
        }
    ),

    [ASSIGNMENTS.ACTIONS.CLOSE_PREVIEW_ASSIGNMENT]: (state) => (
        {
            ...state,
            previewOpened: false,
            currentAssignmentId: null,
            readOnly: true,
        }
    ),
    [ASSIGNMENTS.ACTIONS.OPEN_ASSIGNMENT_EDITOR]: (state, payload) => (
        {
            ...state,
            previewOpened: true,
            currentAssignmentId: get(payload, '_id') || payload,
            readOnly: false,
        }
    ),
})

export default assignmentReducer
