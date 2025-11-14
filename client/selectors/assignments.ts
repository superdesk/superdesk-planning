import {get} from 'lodash';
import {createSelector} from 'reselect';

import {IDesk, IUser} from 'superdesk-api';
import {
    IEventItem,
    IPlanningAppState,
    IPlanningItem,
    IAssignmentSearchParams,
    IAssignmentItem,
    SORT_ORDER,
    SORT_FIELD,
} from '../interfaces';
import {storedEvents} from './events';
import {storedPlannings} from './planning';
import {currentUserId} from './general';
import {coverageProfiles} from './coverageProfiles';
import {getItemsById} from '../utils';
import {ASSIGNMENTS, SORT_DIRECTION, ALL_DESKS} from '../constants';
import moment from 'moment';

export const getStoredAssignments = (state) => get(state, 'assignment.assignments', {});
export const getStoredArchiveItems = (state) => get(state, 'assignment.archive', {});
export const getDayField = (state) => get(state, 'assignment.dayField', null);

export const getAssignmentGroups = (state) => get(
    state,
    'assignment.groupKeys',
    [
        ASSIGNMENTS.LIST_GROUPS.TODO.id,
        ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id,
        ASSIGNMENTS.LIST_GROUPS.COMPLETED.id,
    ]
);

const getList = (state, list) => get(state, `assignment.lists.${list}`, {
    assignmentIds: [],
    total: 0,
    lastPage: 1,
    isLoading: false,
});

const filterBySelectedDay = (
    assignments: IAssignmentItem[] = [],
    selectedDate?: string | null
) => {
    if (selectedDate == null) return assignments;

    return assignments.filter((assignment) => {
        const scheduled = assignment?.planning?.scheduled;

        return scheduled != null && moment(scheduled).isSame(selectedDate, 'day');
    });
};

const selectAssignmentsByDay = (getListSelector) =>
    createSelector([getListSelector, getStoredAssignments, getDayField],
        (list, storedAssignments, dayField) => {
            const items = getListItems(list, storedAssignments);

            return filterBySelectedDay(items, dayField);
        }
    );

const getListIds = (list) => get(list, 'assignmentIds', []);
const getListCount = (list) => get(list, 'total', 0);
const getListLastPage = (list) => get(list, 'lastPage', 1);
const getListSortOrder = (list) => get(list, 'sortOrder', SORT_DIRECTION.ASCENDING);
const getListItems = (list, storedAssignments) => getItemsById(
    getListIds(list),
    storedAssignments
);

// TO DO Assignments
export const getAssignmentsTodo = (state) => getList(state, ASSIGNMENTS.LIST_GROUPS.TODO.id);
export const getAssignmentsInTodoList = createSelector([getAssignmentsTodo], getListIds);
export const getAssignmentsToDoListCount = createSelector([getAssignmentsTodo], getListCount);
export const getAssignmentTodoListPage = createSelector([getAssignmentsTodo], getListLastPage);
export const getAssignmentTodoListSortOrder = createSelector([getAssignmentsTodo], getListSortOrder);
export const getTodoAssignments = selectAssignmentsByDay(getAssignmentsTodo);

// IN PROGRESS Assignments
export const getAssignmentsInProgress = (state) => getList(state, ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id);
export const getAssignmentsInInProgressList = createSelector([getAssignmentsInProgress], getListIds);
export const getAssignmentsInProgressListCount = createSelector([getAssignmentsInProgress], getListCount);
export const getAssignmentInProgressPage = createSelector([getAssignmentsInProgress], getListLastPage);
export const getAssignmentInProgressListSortOrder = createSelector([getAssignmentsInProgress], getListSortOrder);
export const getInProgressAssignments = selectAssignmentsByDay(getAssignmentsInProgress);

// COMPLETED Assignments
export const getAssignmentsCompleted = (state) => getList(state, ASSIGNMENTS.LIST_GROUPS.COMPLETED.id);
export const getAssignmentsInCompletedList = createSelector([getAssignmentsCompleted], getListIds);
export const getAssignmentsCompletedListCount = createSelector([getAssignmentsCompleted], getListCount);
export const getAssignmentCompletedPage = createSelector([getAssignmentsCompleted], getListLastPage);
export const getAssignmentCompletedListSortOrder = createSelector([getAssignmentsCompleted], getListSortOrder);
export const getCompletedAssignments = selectAssignmentsByDay(getAssignmentsCompleted);

// TO DO / CURRENT Assignments
export const getAssignmentsCurrent = (state) => getList(state, ASSIGNMENTS.LIST_GROUPS.CURRENT.id);
export const getAssignmentsCurrentList = createSelector([getAssignmentsCurrent], getListIds);
export const getAssignmentsCurrentListCount = createSelector([getAssignmentsCurrent], getListCount);
export const getAssignmentCurrentPage = createSelector([getAssignmentsCurrent], getListLastPage);
export const getAssignmentCurrentListSortOrder = createSelector([getAssignmentsCurrent], getListSortOrder);
export const getCurrentAssignments = selectAssignmentsByDay(getAssignmentsCurrent);

// TO DO / TODAY Assignments
export const getAssignmentsToday = (state) => getList(state, ASSIGNMENTS.LIST_GROUPS.TODAY.id);
export const getAssignmentsTodayList = createSelector([getAssignmentsToday], getListIds);
export const getAssignmentsTodayListCount = createSelector([getAssignmentsToday], getListCount);
export const getAssignmentTodayPage = createSelector([getAssignmentsToday], getListLastPage);
export const getAssignmentTodayListSortOrder = createSelector([getAssignmentsToday], getListSortOrder);
export const getTodayAssignments = selectAssignmentsByDay(getAssignmentsToday);

// TO DO / FUTURE Assignments
export const getAssignmentsFuture = (state) => getList(state, ASSIGNMENTS.LIST_GROUPS.FUTURE.id);
export const getAssignmentsFutureList = createSelector([getAssignmentsFuture], getListIds);
export const getAssignmentsFutureListCount = createSelector([getAssignmentsFuture], getListCount);
export const getAssignmentFuturePage = createSelector([getAssignmentsFuture], getListLastPage);
export const getAssignmentFutureListSortOrder = createSelector([getAssignmentsFuture], getListSortOrder);
export const getFutureAssignments = selectAssignmentsByDay(getAssignmentsFuture);

export const getAssignmentGroupCounts = createSelector([
    getAssignmentsToDoListCount,
    getAssignmentsInProgressListCount,
    getAssignmentsCompletedListCount,
    getAssignmentsCurrentListCount,
    getAssignmentsTodayListCount,
    getAssignmentsFutureListCount,
],
(todo, inProgress, completed, current, today, future) => ({
    [ASSIGNMENTS.LIST_GROUPS.TODO.id]: todo,
    [ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id]: inProgress,
    [ASSIGNMENTS.LIST_GROUPS.COMPLETED.id]: completed,
    [ASSIGNMENTS.LIST_GROUPS.CURRENT.id]: current,
    [ASSIGNMENTS.LIST_GROUPS.TODAY.id]: today,
    [ASSIGNMENTS.LIST_GROUPS.FUTURE.id]: future,
}));

export const getFilterBy = (state) => get(state, 'assignment.filterBy', 'Desk');
export const getSearchQuery = (state) => get(state, 'assignment.searchQuery', null);
export const getOrderByField = (state) => get(state, 'assignment.orderByField', 'Scheduled');
export const getOrderDirection = (state) => get(state, 'assignment.orderDirection', 'Asc');
export const getAssignmentFilterByState = (state) => get(state, 'assignment.filterByState', null);
export const getAssignmentFilterByType = (state) => get(state, 'assignment.filterByType', null);
export const getSelectedDeskId = (state) => get(state, 'assignment.selectedDeskId', '');
export const getIgnoreScheduledUpdates = (state) => get(state, 'assignment.ignoreScheduledUpdates', false);
export const getAssignmentFilterByPriority = (state) =>
    get(state, 'assignment.filterByPriority', null);

export const getAssignmentListSettings = (state) => ({
    filterBy: getFilterBy(state),
    searchQuery: getSearchQuery(state),
    orderByField: getOrderByField(state),
    dayField: getDayField(state),
    orderDirection: getOrderDirection(state),
    filterByState: getAssignmentFilterByState(state),
    filterByType: getAssignmentFilterByType(state),
    filterByPriority: getAssignmentFilterByPriority(state),
    selectedDeskId: getSelectedDeskId(state),
    ignoreScheduledUpdates: getIgnoreScheduledUpdates(state),
});

export const getAssignmentListSingleGroupView = (state) => get(state,
    'assignment.assignmentListSingleGroupView', null);

export const getPreviewAssignmentOpened = (state) => !!get(state, 'assignment.previewOpened');
export const getCurrentAssignmentId = (state) => get(state, 'assignment.currentAssignmentId');
export const getSelectedArchiveItemId = (state) => get(state, 'assignment.selectedArchiveItemId');
export const getInitialTab = (state) => get(state, 'assignment.initialTab');
export const getAssignmentPriorities = (state) => get(state, 'vocabularies.assignment_priority', []);
export const getArchivePriorities = (state) => get(state, 'vocabularies.priority', []);
export const getUrgencies = (state) => get(state, 'vocabularies.urgency', []);
export const getAssignmentHistory = (state) => get(state, 'assignment.assignmentHistoryItems');

export const getMyAssignmentsCount = (state) => (get(state, 'assignment.myAssignmentsTotal', 0));
export const getBaseAssignmentQuery = (state) => get(state, 'assignment.baseQuery', {must: []});

export const getCurrentAssignment = createSelector(
    [getCurrentAssignmentId, getStoredAssignments],
    (assignmentId, storedAssignments) => (
        get(storedAssignments, assignmentId, null)
    )
);

export const getAssignmentSearchParams = (state) => state.assignment?.searchParams ?? {};

export const getAssignmentSearch = createSelector<
    IPlanningAppState,
    string,
    string,
    SORT_FIELD,
    SORT_ORDER,
    boolean,
    IDesk['_id'] | null,
    IUser['_id'],
    string | null,
    string | null,
    IAssignmentSearchParams,
    IAssignmentSearchParams
>(
    [
        getFilterBy,
        getSearchQuery,
        getOrderByField,
        getOrderDirection,
        getIgnoreScheduledUpdates,
        getSelectedDeskId,
        currentUserId,
        getAssignmentFilterByType,
        getAssignmentFilterByPriority,
        getAssignmentSearchParams,
    ],
    (
        filterBy,
        searchQuery,
        orderByField,
        orderDirection,
        ignoreScheduledUpdates,
        deskId,
        userId,
        filterByType,
        filterByPriority,
        params,
    ) => {
        return {
            deskIds: filterBy === 'Desk' && (deskId?.length ?? 0) > 0 && deskId !== ALL_DESKS ? [deskId] : null,
            userIds: filterBy === 'User' ? [userId] : null,
            searchQuery: searchQuery,
            sortField: orderByField ?? SORT_FIELD.UPDATED,
            sortOrder: orderDirection ?? 'Desc',
            page: 1,
            contentTypes: filterByType ? [filterByType] : null,
            priority: filterByPriority ? filterByPriority : null,
            ignoreScheduledUpdates: ignoreScheduledUpdates,
            ...params,
        } as IAssignmentSearchParams;
    },
);

export const getCurrentAssignmentPlanningItem = createSelector(
    [getCurrentAssignment, storedPlannings],
    (assignment, plannings) => (
        assignment ?
            get(plannings, assignment.planning_item) :
            null
    )
);

/**
 * Returns the coverage profile that was used when creating the assignment.
 * This profile would include any user modifications to the schema not just
 * the default values
 */
export const getCurrentAssignmentCoverageProfile = createSelector(
    [getCurrentAssignment, getCurrentAssignmentPlanningItem, coverageProfiles],
    (assignment, planningItem, profiles) => {
        if (assignment == null || planningItem == null || profiles.length === 0) {
            return null;
        }

        const coverageItem = planningItem.coverages?.find(
            (coverage) => coverage.coverage_id === assignment.coverage_item
        );

        if (coverageItem?.profile == null)
            return null;

        return profiles.find((profile) => profile._id === coverageItem.profile) ?? null;
    }
);

export const getRelatedEventsForCurrentAssignment = createSelector<
    IPlanningAppState,
    IPlanningItem | null,
    {[eventId: string]: IEventItem},
    Array<IEventItem>
>(
    [getCurrentAssignmentPlanningItem, storedEvents],
    (planning, events) => {
        return (planning?.related_events ?? []).map(({_id}) => events[_id]).filter((event) => event != null);
    }
);

export const getCurrentAssignmentArchiveItem = createSelector(
    [getCurrentAssignmentId, getStoredArchiveItems],
    (assignmentId, storedItems) => (
        assignmentId ? get(storedItems, assignmentId, null) : null
    )
);

export const getAssignmentGroupSelectors = {
    [ASSIGNMENTS.LIST_GROUPS.TODO.id]: {
        assignmentsSelector: getTodoAssignments,
        countSelector: getAssignmentsToDoListCount,
        page: getAssignmentTodoListPage,
        assignmentIds: getAssignmentsInTodoList,
        sortOrder: getAssignmentTodoListSortOrder,
        isLoading: null,
    },
    [ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.id]: {
        assignmentsSelector: getInProgressAssignments,
        countSelector: getAssignmentsInProgressListCount,
        page: getAssignmentInProgressPage,
        assignmentIds: getAssignmentsInInProgressList,
        sortOrder: getAssignmentInProgressListSortOrder,
    },
    [ASSIGNMENTS.LIST_GROUPS.COMPLETED.id]: {
        assignmentsSelector: getCompletedAssignments,
        countSelector: getAssignmentsCompletedListCount,
        page: getAssignmentCompletedPage,
        assignmentIds: getAssignmentsInCompletedList,
        sortOrder: getAssignmentCompletedListSortOrder,
    },
    [ASSIGNMENTS.LIST_GROUPS.CURRENT.id]: {
        assignmentsSelector: getCurrentAssignments,
        countSelector: getAssignmentsCurrentListCount,
        page: getAssignmentCurrentPage,
        assignmentIds: getAssignmentsCurrentList,
        sortOrder: getAssignmentCurrentListSortOrder,
    },
    [ASSIGNMENTS.LIST_GROUPS.TODAY.id]: {
        assignmentsSelector: getTodayAssignments,
        countSelector: getAssignmentsTodayListCount,
        page: getAssignmentTodayPage,
        assignmentIds: getAssignmentsTodayList,
        sortOrder: getAssignmentTodayListSortOrder,
    },
    [ASSIGNMENTS.LIST_GROUPS.FUTURE.id]: {
        assignmentsSelector: getFutureAssignments,
        countSelector: getAssignmentsFutureListCount,
        page: getAssignmentFuturePage,
        assignmentIds: getAssignmentsFutureList,
        sortOrder: getAssignmentFutureListSortOrder,
    },
};

Object.keys(getAssignmentGroupSelectors).forEach((groupKey) => {
    getAssignmentGroupSelectors[groupKey].isLoading = (state) => getList(state, groupKey).isLoading;
});
