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
    [RESET_STORE]: () => ({...initialState}),

    [INIT_STORE]: () => ({...initialState}),

    [ASSIGNMENTS.ACTIONS.RECEIVED_ASSIGNMENTS]: produce((draftState, actionPayload) => {
        const receivedAssignments = modifyAssignmentBeingAdded(actionPayload);

        Object.assign(draftState.assignments, receivedAssignments);

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.SET_LIST_ITEMS]: setList,

    [ASSIGNMENTS.ACTIONS.MY_ASSIGNMENTS_TOTAL]: produce((draftState, actionPayload) => {
        draftState.myAssignmentsTotal = actionPayload;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.ADD_LIST_ITEMS]: (state, payload) => (
        addToList(state, payload)
    ),

    [ASSIGNMENTS.ACTIONS.CHANGE_LIST_VIEW_MODE]: produce((draftState, actionPayload) => {
        draftState.assignmentListSingleGroupView = actionPayload;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.SET_LIST_PAGE]: setLastPage,

    [ASSIGNMENTS.ACTIONS.SET_GROUP_SORT_ORDER]: setListSortOrder,

    [ASSIGNMENTS.ACTIONS.SET_LOADING]: setGroupLoading,

    [ASSIGNMENTS.ACTIONS.SET_SORT_FIELD]: produce((draftState, actionPayload) => {
        draftState.orderByField = actionPayload;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.SET_DAY_FIELD]: produce((draftState, actionPayload) => {
        draftState.dayField = actionPayload;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS]: produce((draftState, actionPayload) => {
        Object.assign(draftState, actionPayload);

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.SET_SEARCH_PARAMS]: produce((draftState, actionPayload) => {
        draftState.searchParams = actionPayload;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.PREVIEW_ASSIGNMENT]: produce((draftState, actionPayload) => {
        draftState.previewOpened = true;
        draftState.currentAssignmentId = actionPayload.assignmentId;
        draftState.initialTab = actionPayload.initialTab;
        draftState.selectedArchiveItemId = actionPayload.archiveItemId ?? null;
        draftState.readOnly = true;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.CLOSE_PREVIEW_ASSIGNMENT]: produce((draftState) => {
        draftState.previewOpened = false;
        draftState.currentAssignmentId = null;
        draftState.initialTab = null;
        draftState.selectedArchiveItemId = null;
        draftState.readOnly = true;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT]: (state, payload) => {
        if (!(payload.assignment._id in state.assignments)) return state;

        return produce(state, (draft) => {
            const assignment = draft.assignments[payload.assignment._id];

            assignment.lock_action = payload.assignment.lock_action;
            assignment.lock_user = payload.assignment.lock_user;
            assignment.lock_time = payload.assignment.lock_time;
            assignment.lock_session = payload.assignment.lock_session;
            assignment._etag = payload.assignment._etag;
        });
    },

    [ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT]: (state, payload) => {
        if (!(payload.assignment._id in state.assignments)) return state;

        return produce(state, (draft) => {
            const assignment = draft.assignments[payload.assignment._id];

            delete assignment.lock_action;
            delete assignment.lock_user;
            delete assignment.lock_time;
            delete assignment.lock_session;

            assignment._etag = payload.assignment._etag;
        });
    },

    [ASSIGNMENTS.ACTIONS.RECEIVED_ARCHIVE]: produce((draftState, actionPayload) => {
        // Store Archive items by their ID
        const newItems = (Array.isArray(actionPayload) ? actionPayload : [actionPayload])
            .reduce((archiveItems, item) => {
                archiveItems[item._id] = item;

                return archiveItems;
            }, {});

        Object.assign(draftState.archive, newItems);

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT]: produce((draftState, actionPayload) => {
        // Remove the assignment from the stored list of assignments
        (actionPayload.assignments ?? []).forEach((itemId) => {
            if (!(itemId in draftState.assignments)) {
                return;
            }

            delete draftState.assignments[itemId];

            // If this assignment is being viewed,
            // then close the preview and de-select the assignment
            if (draftState.currentAssignmentId === itemId) {
                draftState.previewOpened = false;
                draftState.currentAssignmentId = null;
                draftState.initialTab = null;
                draftState.selectedArchiveItemId = null;
            }

            // Remove this assignment from any list groups
            filterList(draftState, ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id, itemId);
            filterList(draftState, ASSIGNMENTS.LIST_GROUPS.TODO.id, itemId);
            filterList(draftState, ASSIGNMENTS.LIST_GROUPS.COMPLETED.id, itemId);
            filterList(draftState, ASSIGNMENTS.LIST_GROUPS.CURRENT.id, itemId);
            filterList(draftState, ASSIGNMENTS.LIST_GROUPS.TODAY.id, itemId);
            filterList(draftState, ASSIGNMENTS.LIST_GROUPS.FUTURE.id, itemId);
        });

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.RECEIVE_ASSIGNMENT_HISTORY]: produce((draftState, actionPayload) => {
        draftState.assignmentHistoryItems = actionPayload;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.SET_BASE_QUERY]: produce((draftState, actionPayload) => {
        draftState.baseQuery = actionPayload;

        return draftState;
    }),

    [ASSIGNMENTS.ACTIONS.SET_GROUP_KEYS]: produce((draftState, actionPayload) => {
        draftState.groupKeys = actionPayload;

        return draftState;
    }),
});

export default assignmentReducer;
