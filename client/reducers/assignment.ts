import {uniq, keyBy, get, cloneDeep, filter} from 'lodash';
import {ASSIGNMENTS, RESET_STORE, INIT_STORE, SORT_DIRECTION} from '../constants';
import moment from 'moment';
import {createReducer} from './createReducer';
import {getItemId} from '../utils';

const initialState = {
    archive: {},
    assignments: {},
    baseQuery: {must: []},
    currentAssignmentId: null,
    filterBy: 'Desk',
    filterByPriority: null,
    filterByType: null,
    myAssignmentsTotal: 0,
    orderByField: 'Scheduled',
    previewOpened: false,
    readOnly: false,
    searchQuery: null,
    selectedDeskId: '',
    assignmentListSingleGroupView: null,

    groupKeys: [
        ASSIGNMENTS.LIST_GROUPS.TODO.id,
        ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id,
        ASSIGNMENTS.LIST_GROUPS.COMPLETED.id,
    ],
    lists: {
        [ASSIGNMENTS.LIST_GROUPS.TODO.id]: {
            assignmentIds: [],
            total: 0,
            lastPage: null,
            sortOrder: SORT_DIRECTION.ASCENDING,
        },
        [ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id]: {
            assignmentIds: [],
            total: 0,
            lastPage: null,
            sortOrder: SORT_DIRECTION.DESCENDING,
        },
        [ASSIGNMENTS.LIST_GROUPS.COMPLETED.id]: {
            assignmentIds: [],
            total: 0,
            lastPage: null,
            sortOrder: SORT_DIRECTION.DESCENDING,
        },
        [ASSIGNMENTS.LIST_GROUPS.CURRENT.id]: {
            assignmentIds: [],
            total: 0,
            lastPage: null,
            sortOrder: SORT_DIRECTION.ASCENDING,
        },
        [ASSIGNMENTS.LIST_GROUPS.TODAY.id]: {
            assignmentIds: [],
            total: 0,
            lastPage: null,
            sortOrder: SORT_DIRECTION.ASCENDING,
        },
        [ASSIGNMENTS.LIST_GROUPS.FUTURE.id]: {
            assignmentIds: [],
            total: 0,
            lastPage: null,
            sortOrder: SORT_DIRECTION.ASCENDING,
        },
    },
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

const setList = (state, payload) => {
    state.lists[payload.list] = {
        ...state.lists[payload.list],
        assignmentIds: payload.ids,
        total: payload.total,
        lastPage: 1,
    };

    return state;
};

const addToList = (state, payload) => {
    state.lists[payload.list].assignmentIds = uniq([
        ...state.lists[payload.list].assignmentIds,
        ...payload.ids,
    ]);
    state.lists[payload.list].total = payload.total;

    return state;
};

const setLastPage = (state, payload) => {
    state.lists[payload.list].lastPage = payload.page;

    return state;
};

const setListSortOrder = (state, payload) => {
    state.lists[payload.list].sortOrder = payload.sortOrder;

    return state;
};

const filterList = (state, listId, assignmentId) => {
    if (state.lists[listId].assignmentIds.indexOf(assignmentId) < 0) {
        return;
    }

    state.lists[listId].assignmentIds = filter(
        state.lists[listId].assignmentIds,
        (aid) => aid !== assignmentId
    );

    state.lists[listId].total = state.lists[listId].total - 1;
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

    [ASSIGNMENTS.ACTIONS.SET_LIST_ITEMS]: (state, payload) => (
        setList(cloneDeep(state), payload)
    ),

    [ASSIGNMENTS.ACTIONS.MY_ASSIGNMENTS_TOTAL]: (state, payload) => (
        {
            ...state,
            myAssignmentsTotal: payload,
        }
    ),

    [ASSIGNMENTS.ACTIONS.ADD_LIST_ITEMS]: (state, payload) => (
        addToList(cloneDeep(state), payload)
    ),

    [ASSIGNMENTS.ACTIONS.CHANGE_LIST_VIEW_MODE]: (state, payload) => (
        {
            ...state,
            assignmentListSingleGroupView: payload,
        }
    ),

    [ASSIGNMENTS.ACTIONS.SET_LIST_PAGE]: (state, payload) => (
        setLastPage(cloneDeep(state), payload)
    ),

    [ASSIGNMENTS.ACTIONS.SET_GROUP_SORT_ORDER]: (state, payload) => (
        setListSortOrder(cloneDeep(state), payload)
    ),

    [ASSIGNMENTS.ACTIONS.SET_SORT_FIELD]: (state, payload) => ({
        ...state,
        orderByField: payload,
    }),

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
            currentAssignmentId: getItemId(payload) || payload,
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

    [ASSIGNMENTS.ACTIONS.RECEIVED_ARCHIVE]: (state, payload) => {
        const archiveItems = {};

        if (Array.isArray(payload)) { // Multiple items
            for (const newItem of payload) {
                if (newItem.assignment_id) {
                    archiveItems[newItem.assignment_id] = newItem;
                }
            }
        } else { // One single item
            archiveItems[payload.assignment_id] = payload;
        }

        return {
            ...state,
            archive: {
                ...state.archive,
                ...archiveItems,
            },
        };
    },

    [ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT]: (oldState, payload) => {
        const state = cloneDeep(oldState);

        // Remove the assignment from the stored list of assignments
        (get(payload, 'assignments') || []).forEach((a) => {
            if (a in state.assignments) {
                delete state.assignments[a];
                // If this assignment is being viewed,
                // then close the preview and de-select the assignment
                if (state.currentAssignmentId === a) {
                    state.previewOpened = false;
                    state.currentAssignmentId = null;
                }

                // Remove this assignment from any list groups
                filterList(state, ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id, a);
                filterList(state, ASSIGNMENTS.LIST_GROUPS.TODO.id, a);
                filterList(state, ASSIGNMENTS.LIST_GROUPS.COMPLETED.id, a);
                filterList(state, ASSIGNMENTS.LIST_GROUPS.CURRENT.id, a);
                filterList(state, ASSIGNMENTS.LIST_GROUPS.TODAY.id, a);
                filterList(state, ASSIGNMENTS.LIST_GROUPS.FUTURE.id, a);
            }
        });

        return state;
    },

    [ASSIGNMENTS.ACTIONS.RECEIVE_ASSIGNMENT_HISTORY]: (state, payload) => ({
        ...state,
        assignmentHistoryItems: payload,
    }),

    [ASSIGNMENTS.ACTIONS.SET_BASE_QUERY]: (state, payload) => ({
        ...state,
        baseQuery: payload,
    }),

    [ASSIGNMENTS.ACTIONS.SET_GROUP_KEYS]: (state, payload) => ({
        ...state,
        groupKeys: payload,
    }),
});

export default assignmentReducer;
