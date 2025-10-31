import {uniq, keyBy} from 'lodash';
import {produce} from 'immer';
import {ASSIGNMENTS, RESET_STORE, INIT_STORE, SORT_DIRECTION} from '../constants';
import moment from 'moment';
import {createReducer} from './createReducer';

const initialState = {
    archive: {},
    assignments: {},
    baseQuery: {must: []},
    currentAssignmentId: null,
    selectedArchiveItemId: null,
    initialTab: null,
    filterBy: 'Desk',
    filterByPriority: null,
    filterByType: null,
    myAssignmentsTotal: 0,
    orderByField: 'Scheduled',
    dayField: null,
    previewOpened: false,
    readOnly: false,
    searchQuery: null,
    selectedDeskId: '',
    assignmentListSingleGroupView: null,
    searchParams: {},

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
    const assignments = Array.isArray(payload) ? payload : [payload];

    assignments.forEach((assignment) => {
        if (assignment.planning?.scheduled) {
            assignment.planning.scheduled = moment(assignment.planning.scheduled);
        }
    });

    return keyBy(payload, '_id');
};

const setList = produce((state, payload) => {
    state.lists[payload.list].assignmentIds = payload.ids;
    state.lists[payload.list].total = payload.total;
    state.lists[payload.list].lastPage = 1;

    return state;
});

const addToList = produce((state, payload) => {
    state.lists[payload.list].assignmentIds = uniq([
        ...state.lists[payload.list].assignmentIds,
        ...payload.ids,
    ]);

    state.lists[payload.list].total = payload.total;

    return state;
});

const setLastPage = produce((state, payload) => {
    state.lists[payload.list].lastPage = payload.page;

    return state;
});

const setListSortOrder = produce((state, payload) => {
    state.lists[payload.list].sortOrder = payload.sortOrder;

    return state;
});

const setGroupLoading = produce((state, payload) => {
    state.lists[payload.list].isLoading = payload.isLoading;

    return state;
});

const filterList = (state, listId, assignmentId) => {
    if (state.lists[listId].assignmentIds.indexOf(assignmentId) < 0) {
        return;
    }

    state.lists[listId].assignmentIds = state.lists[listId].assignmentIds.filter((id) => id != assignmentId);
    state.lists[listId].total = state.lists[listId].total - 1;
};

const assignmentReducer = createReducer(initialState, {
    [RESET_STORE]: () => (null),

    [INIT_STORE]: () => (initialState),

    [ASSIGNMENTS.ACTIONS.RECEIVED_ASSIGNMENTS]: produce((state, payload) => {
        const receivedAssignments = modifyAssignmentBeingAdded(payload);

        Object.assign(state.assignments, receivedAssignments);

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.SET_LIST_ITEMS]: setList,

    [ASSIGNMENTS.ACTIONS.MY_ASSIGNMENTS_TOTAL]: produce((state, payload) => {
        state.myAssignmentsTotal = payload;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.ADD_LIST_ITEMS]: (state, payload) => (
        addToList(state, payload)
    ),

    [ASSIGNMENTS.ACTIONS.CHANGE_LIST_VIEW_MODE]: produce((state, payload) => {
        state.assignmentListSingleGroupView = payload;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.SET_LIST_PAGE]: setLastPage,

    [ASSIGNMENTS.ACTIONS.SET_GROUP_SORT_ORDER]: setListSortOrder,

    [ASSIGNMENTS.ACTIONS.SET_LOADING]: setGroupLoading,

    [ASSIGNMENTS.ACTIONS.SET_SORT_FIELD]: produce((state, payload) => {
        state.orderByField = payload;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.SET_DAY_FIELD]: produce((state, payload) => {
        state.dayField = payload;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS]: produce((state, payload) => {
        Object.assign(state, payload);

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.SET_SEARCH_PARAMS]: produce((state, payload) => {
        state.searchParams = payload;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.PREVIEW_ASSIGNMENT]: produce((state, payload) => {
        state.previewOpened = true;
        state.currentAssignmentId = payload.assignmentId;
        state.initialTab = payload.initialTab;
        state.selectedArchiveItemId = payload.archiveItemId ?? null;
        state.readOnly = true;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.CLOSE_PREVIEW_ASSIGNMENT]: produce((state) => {
        state.previewOpened = false;
        state.currentAssignmentId = null;
        state.initialTab = null;
        state.selectedArchiveItemId = null;
        state.readOnly = true;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT]: produce((state, payload) => {
        if (!(payload.assignment._id in state.assignments)) return state;

        const assignment = state.assignments[payload.assignment._id];

        assignment.lock_action = payload.assignment.lock_action;
        assignment.lock_user = payload.assignment.lock_user;
        assignment.lock_time = payload.assignment.lock_time;
        assignment.lock_session = payload.assignment.lock_session;
        assignment._etag = payload.assignment._etag;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT]: produce((state, payload) => {
        if (!(payload.assignment._id in state.assignments)) return state;

        const assignment = state.assignments[payload.assignment._id];

        delete assignment.lock_action;
        delete assignment.lock_user;
        delete assignment.lock_time;
        delete assignment.lock_session;

        assignment._etag = payload.assignment._etag;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.RECEIVED_ARCHIVE]: produce((state, payload) => {
        // Store Archive items by their ID
        const newItems = (Array.isArray(payload) ? payload : [payload])
            .reduce((archiveItems, item) => {
                archiveItems[item._id] = item;

                return archiveItems;
            }, {});

        Object.assign(state.archive, newItems);

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT]: produce((state, payload) => {
        // Remove the assignment from the stored list of assignments
        (payload.assignments ?? []).forEach((itemId) => {
            if (!(itemId in state.assignments)) {
                return;
            }

            delete state.assignments[itemId];

            // If this assignment is being viewed,
            // then close the preview and de-select the assignment
            if (state.currentAssignmentId === itemId) {
                state.previewOpened = false;
                state.currentAssignmentId = null;
                state.initialTab = null;
                state.selectedArchiveItemId = null;
            }

            // Remove this assignment from any list groups
            filterList(state, ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id, itemId);
            filterList(state, ASSIGNMENTS.LIST_GROUPS.TODO.id, itemId);
            filterList(state, ASSIGNMENTS.LIST_GROUPS.COMPLETED.id, itemId);
            filterList(state, ASSIGNMENTS.LIST_GROUPS.CURRENT.id, itemId);
            filterList(state, ASSIGNMENTS.LIST_GROUPS.TODAY.id, itemId);
            filterList(state, ASSIGNMENTS.LIST_GROUPS.FUTURE.id, itemId);
        });

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.RECEIVE_ASSIGNMENT_HISTORY]: produce((state, payload) => {
        state.assignmentHistoryItems = payload;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.SET_BASE_QUERY]: produce((state, payload) => {
        state.baseQuery = payload;

        return state;
    }),

    [ASSIGNMENTS.ACTIONS.SET_GROUP_KEYS]: produce((state, payload) => {
        state.groupKeys = payload;

        return state;
    }),
});

export default assignmentReducer;
