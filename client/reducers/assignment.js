import {uniq, keyBy, get, cloneDeep, filter, pickBy} from 'lodash';
import {ASSIGNMENTS, RESET_STORE, INIT_STORE} from '../constants';
import moment from 'moment';
import {createReducer} from '../utils';

const initialState = {
    assignments: {},
    filterBy: 'All',
    previewOpened: false,
    assignmentsInInProgressList: [],
    assignmentsInTodoList: [],
    assignmentsInCompletedList: [],
    assignmentListSingleGroupView: null,
    currentAssignmentId: null,
    archive: {},
};

const modifyAssignmentBeingAdded = (payload) => {
    // payload must be an array. If not, we transform
    const assignments = Array.isArray(payload) ? payload : [payload];

    assignments.forEach((assignment) => {
        if (get(assignment, 'planning.scheduled')) {
            assignment.planning.scheduled = moment(assignment.planning.scheduled);
        }
    });
    return keyBy(payload, '_id');
};

const assignmentReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [ASSIGNMENTS.ACTIONS.RECEIVED_ASSIGNMENTS]: (state, payload) => {
        let receivedAssignments = modifyAssignmentBeingAdded(payload);

        return {
            ...state,
            assignments: {
                ...state.assignments || {},
                ...receivedAssignments,
            },
        };
    },

    [ASSIGNMENTS.ACTIONS.SET_TODO_LIST]: (state, payload) => (
        {
            ...state,
            assignmentsInTodoList: payload.ids,
            todoListTotal: payload.total,
            todoListLastLoadedPage: 1,
        }
    ),

    [ASSIGNMENTS.ACTIONS.SET_IN_PROGRESS_LIST]: (state, payload) => (
        {
            ...state,
            assignmentsInInProgressList: payload.ids,
            inProgressListTotal: payload.total,
            inProgressListLastLoadedPage: 1,
        }
    ),

    [ASSIGNMENTS.ACTIONS.SET_COMPLETED_LIST]: (state, payload) => (
        {
            ...state,
            assignmentsInCompletedList: payload.ids,
            completedListTotal: payload.total,
            completedListLastLoadedPage: 1,
        }
    ),

    [ASSIGNMENTS.ACTIONS.ADD_TO_TODO_LIST]: (state, payload) => (
        {
            ...state,
            assignmentsInTodoList: uniq([...state.assignmentsInTodoList, ...payload]),
        }
    ),

    [ASSIGNMENTS.ACTIONS.ADD_TO_IN_PROGRESS_LIST]: (state, payload) => (
        {
            ...state,
            assignmentsInInProgressList: uniq([...state.assignmentsInInProgressList, ...payload]),
        }
    ),

    [ASSIGNMENTS.ACTIONS.ADD_TO_COMPLETED_LIST]: (state, payload) => (
        {
            ...state,
            assignmentsInCompletedList: uniq([...state.assignmentsInCompletedList, ...payload]),
        }
    ),

    [ASSIGNMENTS.ACTIONS.CHANGE_LIST_VIEW_MODE]: (state, payload) => (
        {
            ...state,
            assignmentListSingleGroupView: payload,
        }
    ),

    [ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS]: (state, payload) => (
        {
            ...state,
            ...payload,
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
    [ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT]: (state, payload) => {
        if (!(payload.assignment._id in state.assignments)) return state;

        let assignments = cloneDeep(state.assignments);
        let assignment = assignments[payload.assignment._id];

        assignment.lock_action = payload.assignment.lock_action;
        assignment.lock_user = payload.assignment.lock_user;
        assignment.lock_time = payload.assignment.lock_time;
        assignment.lock_session = payload.assignment.lock_session;
        assignment._etag = payload.assignment._etag;

        return {
            ...state,
            assignments,
        };
    },

    [ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT]: (state, payload) => {
        if (!(payload.assignment._id in state.assignments)) return state;

        let assignments = cloneDeep(state.assignments);
        let assignment = assignments[payload.assignment._id];

        delete assignment.lock_action;
        delete assignment.lock_user;
        delete assignment.lock_time;
        delete assignment.lock_session;
        assignment._etag = payload.assignment._etag;

        return {
            ...state,
            assignments,
        };
    },

    [ASSIGNMENTS.ACTIONS.RECEIVED_ARCHIVE]: (state, payload) => ({
        ...state,
        archive: {
            ...state.archive,
            [payload.assignment_id]: payload,
        },
    }),

    [ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT]: (state, payload) => (
        // If the Assignment isn't loaded, then disregard this action
        !(payload.assignment in state.assignments) ? state :

        // Otherwise filter out the Assignment from the store
            {
                ...state,
                assignments: pickBy(
                    state.assignments, (assignment, key) => key !== payload.assignment
                ),
                assignmentsInInProgressList: filter(
                    state.assignmentsInInProgressList, (aid) => aid !== payload.assignment
                ),
                assignmentsInTodoList: filter(
                    state.assignmentsInTodoList, (aid) => aid !== payload.assignment
                ),
                assignmentsInCompletedList: filter(
                    state.assignmentsInCompletedList, (aid) => aid !== payload.assignment
                ),
                previewOpened: state.currentAssignmentId === payload.assignment ?
                    false : state.previewOpened,
                currentAssignmentId: state.currentAssignmentId === payload.assignment ?
                    null : state.currentAssignmentId,
            }
    ),
    [ASSIGNMENTS.ACTIONS.RECEIVE_ASSIGNMENT_HISTORY]: (state, payload) => ({
        ...state,
        assignmentHistoryItems: payload,
    }),
});

export default assignmentReducer;
