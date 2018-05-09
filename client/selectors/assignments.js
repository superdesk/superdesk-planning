import {get} from 'lodash';
import {storedEvents} from './events';
import {storedPlannings} from './planning';
import {currentDeskId, currentUserId, currentWorkspace} from './general';
import {createSelector} from 'reselect';
import {getItemsById} from '../utils';
import {WORKSPACE} from '../constants';

export const getStoredAssignments = (state) => get(state, 'assignment.assignments', {});
export const getStoredArchiveItems = (state) => get(state, 'assignment.archive', {});
export const getAssignmentsInTodoList = (state) => get(state,
    'assignment.assignmentsInTodoList', []);
export const getAssignmentsInInProgressList = (state) => get(state,
    'assignment.assignmentsInInProgressList', []);
export const getAssignmentsInCompletedList = (state) => get(state,
    'assignment.assignmentsInCompletedList', []);
export const getFilterBy = (state) => get(state, 'assignment.filterBy', 'ALL');
export const getSearchQuery = (state) => get(state, 'assignment.searchQuery', null);
export const getOrderByField = (state) => get(state, 'assignment.orderByField', 'Updated');
export const getOrderDirection = (state) => get(state, 'assignment.orderDirection', 'Desc');
export const getAssignmentFilterByState = (state) => get(state, 'assignment.filterByState', null);
export const getAssignmentFilterByType = (state) => get(state, 'assignment.filterByType', null);
export const getAssignmentFilterByPriority = (state) =>
    get(state, 'assignment.filterByPriority', null);
export const getAssignmentTodoListPage = (state) => get(state,
    'assignment.todoListLastLoadedPage', 1);
export const getAssignmentInProgressPage = (state) => get(state,
    'assignment.inProgressListLastLoadedPage', 1);
export const getAssignmentCompletedPage = (state) => get(state,
    'assignment.completedListLastLoadedPage', 1);
export const getAssignmentListSettings = (state) => ({
    filterBy: getFilterBy(state),
    searchQuery: getSearchQuery(state),
    orderByField: getOrderByField(state),
    orderDirection: getOrderDirection(state),
    filterByState: getAssignmentFilterByState(state),
    filterByType: getAssignmentFilterByType(state),
    filterByPriority: getAssignmentFilterByPriority(state),
});
export const getAssignmentsToDoListCount = (state) => (get(state, 'assignment.todoListTotal', 0));
export const getAssignmentsInProgressListCount = (state) => (get(state,
    'assignment.inProgressListTotal', 0));
export const getAssignmentsCompletedListCount = (state) => (get(state,
    'assignment.completedListTotal', 0));
export const getAssignmentListSingleGroupView = (state) => get(state,
    'assignment.assignmentListSingleGroupView', null);

export const getPreviewAssignmentOpened = (state) => !!get(state, 'assignment.previewOpened');
export const getCurrentAssignmentId = (state) => get(state, 'assignment.currentAssignmentId');
export const getAssignmentPriorities = (state) => get(state, 'vocabularies.assignment_priority', []);
export const getArchivePriorities = (state) => get(state, 'vocabularies.priority', []);
export const getUrgencies = (state) => get(state, 'vocabularies.urgency', []);
export const getAssignmentHistory = (state) => get(state, 'assignment.assignmentHistoryItems');

export const getMyAssignmentsCount = (state) => (get(state, 'assignment.myAssignmentsTotal', 0));

export const getTodoAssignments = createSelector(
    [getAssignmentsInTodoList, getStoredAssignments],
    (assignmentIds, storedAssignments) => (getItemsById(assignmentIds, storedAssignments))
);

export const getInProgressAssignments = createSelector(
    [getAssignmentsInInProgressList, getStoredAssignments],
    (assignmentIds, storedAssignments) => (getItemsById(assignmentIds, storedAssignments))
);

export const getCompletedAssignments = createSelector(
    [getAssignmentsInCompletedList, getStoredAssignments],
    (assignmentIds, storedAssignments) => (getItemsById(assignmentIds, storedAssignments))
);

export const getCurrentAssignment = createSelector(
    [getCurrentAssignmentId, getStoredAssignments],
    (assignmentId, storedAssignments) => (
        get(storedAssignments, assignmentId, null)
    )
);

export const getAssignmentSearch = createSelector(
    [getAssignmentListSettings, currentDeskId, currentUserId,
        currentWorkspace, getAssignmentFilterByType,
        getAssignmentFilterByPriority],
    (listSettings, deskId,
        currentUserId, workspace, filterByType, filterByPriority) => {
        const assignmentSearch = {
            deskId: (
                get(listSettings, 'filterBy') === 'All' ||
                workspace === WORKSPACE.AUTHORING
            ) ? deskId : null,
            userId: (get(listSettings, 'filterBy') === 'User') ? currentUserId : null,
            searchQuery: get(listSettings, 'searchQuery', ''),
            orderByField: get(listSettings, 'orderByField', 'Updated'),
            orderDirection: get(listSettings, 'orderDirection', 'Desc'),
            page: 1,
            states: null,
            type: filterByType,
            priority: filterByPriority,
        };

        return assignmentSearch;
    }
);

export const getCurrentAssignmentPlanningItem = createSelector(
    [getCurrentAssignment, storedPlannings],
    (assignment, plannings) => (
        assignment ?
            get(plannings, assignment.planning_item) :
            null
    )
);

export const getCurrentAssignmentEventItem = createSelector(
    [getCurrentAssignmentPlanningItem, storedEvents],
    (planning, events) => (
        planning ?
            get(events, planning.event_item) :
            null
    )
);

export const getCurrentAssignmentArchiveItem = createSelector(
    [getCurrentAssignmentId, getStoredArchiveItems],
    (assignmentId, storedItems) => (
        assignmentId ? get(storedItems, assignmentId, null) : null
    )
);
