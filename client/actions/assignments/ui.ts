import {get, cloneDeep, forEach} from 'lodash';
import moment from 'moment';

import {planningApi, superdeskApi} from '../../superdeskApi';
import {IAssignmentItem} from '../../interfaces';

import {showModal} from '../index';
import assignments from './index';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS, MODALS, WORKSPACE, ALL_DESKS} from '../../constants';
import {getErrorMessage, assignmentUtils, gettext} from '../../utils';

/**
 * Action dispatcher to load the list of assignments for current list settings.
 * @param {String} filterBy - the filter by desk or user ('Desk', 'User')
 * @param {String} searchQuery - the text used for free text query
 * @param {String} orderByField - the field used to order the assignments ('Created', 'Updated')
 * @param {String} filterByType - Type of the assignment
 * @param {String} filterByPriority - The priority to filter for
 * @param {String} selectedDeskId - The Desk ID
 */
const loadAssignments = ({
    filterBy = 'Desk',
    searchQuery = null,
    orderByField = 'Scheduled',
    dayField = null,
    filterByType = null,
    filterByPriority = null,
    selectedDeskId = null,
    ignoreScheduledUpdates = false,
}) => (dispatch) => {
    dispatch(
        self.changeListSettings({
            filterBy,
            searchQuery,
            orderByField,
            dayField,
            filterByType,
            filterByPriority,
            selectedDeskId,
            ignoreScheduledUpdates,
        })
    );

    return dispatch(
        self.reloadAssignments(null, false)
    );
};

/**
 * Action dispatcher to set store values and load appropriate Assignments
 * @param {Object} item - Archive item being fulfilled
 * @param {Array<String>} groupKeys - Array of keys for the list groups to show
 */
const loadFulfillModal = (item, groupKeys) => (
    (dispatch, getState, {desks}) => {
        dispatch(self.setListGroups(groupKeys));

        const searchQuery = get(item, 'slugline') ?
            `planning.slugline.phrase:("${item.slugline}")` :
            null;

        return dispatch(self.loadAssignments({
            filterBy: 'Desk',
            searchQuery: searchQuery,
            orderByField: 'Scheduled',
            filterByType: get(item, 'type'),
            filterByPriority: null,
            selectedDeskId: ALL_DESKS,
            ignoreScheduledUpdates: true,
        }));
    }
);

/**
 * Action dispatcher to open the first Assignment in a list group for preview
 * @param {String} groupKey - The key for the Assignment list group
 */
const previewFirstInListGroup = (groupKey) => (
    (dispatch, getState) => {
        const group = selectors.getAssignmentGroupSelectors[groupKey];
        const assignments = selectors.getStoredAssignments(getState());
        const assignmentIds = group.assignmentIds(getState());

        if (get(assignmentIds, 'length', 0) > 0 &&
            get(assignments, assignmentIds[0])
        ) {
            dispatch(self.preview(assignments[assignmentIds[0]]));
        }
    }
);

const queryAndGetMyAssignments = (filterByState) => (
    (dispatch, getState) => {
        let querySearchSettings = cloneDeep(selectors.getAssignmentSearch(getState()));

        querySearchSettings.states = filterByState;

        querySearchSettings.deskId = null;
        querySearchSettings.userId = selectors.general.currentUserId(getState());

        querySearchSettings.size = 0;

        return dispatch(assignments.api.query(querySearchSettings))
            .then((data) => {
                dispatch(self.setMyAssignmentsTotal(get(data, '_meta.total')));
            });
    }
);

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 * @param {Array<String>} filterByState - Array of states used to get the list groups (defaults to current list groups)
 * @param {boolean} resetPage - If true, the page for the list groups are set to 1
 */
const reloadAssignments = (filterByState = null, resetPage = true) => (
    (dispatch, getState) => {
        const visibleGroups = selectors.getAssignmentGroups(getState());
        let listGroups = (!filterByState || filterByState.length <= 0) ?
            visibleGroups :
            assignmentUtils.getAssignmentGroupsByStates(visibleGroups, filterByState);

        let dispatches = [];

        listGroups.forEach((key) => (
            dispatches.push(
                dispatch(self.reloadAssignmentList(key, resetPage))
            )
        ));

        return Promise.all(dispatches);
    }
);

/**
 * Action dispatcher to reload a single list of Assignments
 * @param {String} list - The list group key to reload
 * @param {boolean} resetPage - If true, the page for the list groups are set to 1
 * @returns {Promise} - A promise containing the result of queryAndSetAssignmentListGroups action
 */
const reloadAssignmentList = (list, resetPage = true) => (
    (dispatch) => {
        if (resetPage) {
            dispatch(self.changeLastAssignmentLoadedPage(
                ASSIGNMENTS.LIST_GROUPS[list]
            ));
        }

        return dispatch(self.queryAndSetAssignmentListGroups(list));
    }
);

const updatePreviewItemOnRouteUpdate = () => (
    (dispatch, getState, {$location, notify, desks}) => {
        // Load assignment item in URL
        const urlItem = $location.search().assignment;

        if (urlItem && urlItem !== get(selectors.getCurrentAssignment(getState()), '_id')) {
            const assignment =
                get(selectors.getStoredAssignments(getState()), urlItem);

            if (!assignment) {
                // Fetch it from backend
                return dispatch(assignments.api.fetchAssignmentById(urlItem, false, false))
                    .then((item) => {
                        if (item) {
                            // Preview only if user is a member of that assignment's desk
                            const currentUserId = selectors.general.currentUserId(getState());
                            const user = desks.deskMembers[item.assigned_to.desk].find(
                                (u) => u._id === currentUserId);

                            if (user) {
                            // For previewing, add it to the store even though it might be from another
                                dispatch(assignments.api.receivedAssignments([item]));
                                return dispatch(self.preview(item));
                            } else {
                                notify.error('Insufficient privileges to view the assignment');
                                $location.search('assignment', null);
                                return dispatch(self.closePreview());
                            }
                        }
                    },
                    () => {
                        notify.error('Assignment does not exist');
                        return dispatch(self.closePreview());
                    });
            } else {
                return dispatch(self.preview(assignment));
            }
        } else {
            return Promise.resolve();
        }
    }
);

const queryAndSetAssignmentListGroups = (groupKey, page = 1) => (
    (dispatch, getState) => {
        dispatch(assignments.ui.setLoading(groupKey, true));

        let querySearchSettings = cloneDeep(selectors.getAssignmentSearch(getState()));
        const assignmentListSelectors = selectors.getAssignmentGroupSelectors[groupKey];
        const group = ASSIGNMENTS.LIST_GROUPS[groupKey];

        querySearchSettings.states = group.states;
        querySearchSettings.page = page;
        querySearchSettings.dateFilter = group.dateFilter;
        querySearchSettings.orderDirection = assignmentListSelectors.sortOrder(getState());
        if (group.max_results) {
            querySearchSettings.max_results = group.max_results;
        }

        return dispatch(assignments.api.query(querySearchSettings))
            .then((data) => {
                dispatch(assignments.api.receivedAssignments(data._items));
                if (page === 1) {
                    dispatch(self.setAssignmentListGroup(
                        data._items.map((a) => a._id),
                        get(data, '_meta.total'),
                        group
                    ));
                } else {
                    dispatch(self.addToAssignmentListGroup(
                        data._items.map((a) => a._id),
                        get(data, '_meta.total'),
                        group
                    ));
                }

                return Promise.resolve(data._items);
            })
            .finally(() => {
                dispatch(assignments.ui.setLoading(groupKey, false));
            });
    }
);

const setLoading = (groupKey: string, isLoading: boolean) => ({
    type: ASSIGNMENTS.ACTIONS.SET_LOADING,
    payload: {
        list: groupKey,
        isLoading: isLoading,
    },
});

/**
 * Action dispatcher to load the next page of assignments.
 */
const loadMoreAssignments = (groupKey) => (
    (dispatch, getState) => {
        const listGroup = ASSIGNMENTS.LIST_GROUPS[groupKey];
        const lastLoadedPageForListGroup = selectors.getAssignmentGroupSelectors[groupKey]
            .page(getState());
        const page = lastLoadedPageForListGroup + 1 || 1;

        dispatch(self.changeLastAssignmentLoadedPage(listGroup, page));
        return dispatch(self.queryAndSetAssignmentListGroups(groupKey, page));
    }
);

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const changeAssignmentListSingleGroupView = (groupKey) => (
    (dispatch, getState) => {
        let assignmentListSingleGroupView = selectors.getAssignmentListSingleGroupView(getState());

        if (!assignmentListSingleGroupView && groupKey) {
            assignmentListSingleGroupView = groupKey;
        } else if (assignmentListSingleGroupView) {
            assignmentListSingleGroupView = null;
        }

        dispatch({
            type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_VIEW_MODE,
            payload: assignmentListSingleGroupView,
        });
    }
);

/**
 * Action to change the last loaded page for the list of Assignments
 * @param {Object} listGroup - The group to change the page number for
 * @param {number} pageNum - the last loaded page
 * @return object
 */
const changeLastAssignmentLoadedPage = (listGroup, pageNum = 1) => ({
    type: ASSIGNMENTS.ACTIONS.SET_LIST_PAGE,
    payload: {
        list: listGroup.id,
        page: pageNum,
    },
});

/**
 * Action to change the filter&search for the list of Assignments
 * @param {string} filterBy - the filter by desk or user ('Desk', 'User')
 * @param {string} searchQuery - the text used for free text query
 * @param {string} orderByField - the field used to order the assignments ('Created', 'Updated')
 * @param {string} filterByPriority - Priority of the assignment
 * @param {string} filterByType - Type of the assignment
 * @param {string} selectedDeskId - Desk Id
 * @return object
 */
const changeListSettings = ({
    filterBy = 'Desk',
    searchQuery = null,
    orderByField = 'Scheduled',
    dayField = null,
    filterByType = null,
    filterByPriority = null,
    selectedDeskId = null,
    ignoreScheduledUpdates = false,
}) => ({
    type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
    payload: {
        filterBy,
        searchQuery,
        orderByField,
        dayField,
        filterByType,
        filterByPriority,
        selectedDeskId,
        ignoreScheduledUpdates,
    },
});

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 * @param {Array<String>} assignmentIds - Array of Assignment ids for the list
 * @param {number} totalNoOfItems - The total number of items for the list
 * @param {Object} group - The group to set the list for
 */
const setAssignmentListGroup = (assignmentIds, totalNoOfItems, group) => ({
    type: ASSIGNMENTS.ACTIONS.SET_LIST_ITEMS,
    payload: {
        list: group.id,
        ids: assignmentIds,
        total: totalNoOfItems,
    },
});

const setMyAssignmentsTotal = (total) => (
    (dispatch) => dispatch({
        type: ASSIGNMENTS.ACTIONS.MY_ASSIGNMENTS_TOTAL,
        payload: total,
    })
);

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const addToAssignmentListGroup = (assignmentIds, totalNoOfItems, group) => ({
    type: ASSIGNMENTS.ACTIONS.ADD_LIST_ITEMS,
    payload: {
        list: group.id,
        ids: assignmentIds,
        total: totalNoOfItems,
    },
});

/**
 * Open assignment in preview mode
 * @param {object} assignment - The Assignment to preview
 * @return object
 */
const preview = (assignment) => (
    (dispatch, getState, {$timeout, $location}) => (
        dispatch(assignments.api.loadPlanningAndEvent(assignment))
            .then(() => {
                $timeout(() => $location.search('assignment', get(assignment, '_id', null)));
                return dispatch({
                    type: ASSIGNMENTS.ACTIONS.PREVIEW_ASSIGNMENT,
                    payload: assignment,
                });
            })
    )
);

/**
 * Close the preview assignment
 * @return object
 */
const closePreview = () => (
    (dispatch, getState, {$timeout, $location}) => {
        $timeout(() => $location.search('assignment', null));
        return dispatch({type: ASSIGNMENTS.ACTIONS.CLOSE_PREVIEW_ASSIGNMENT});
    }
);


/**
 * Action for opening modal to reassign
 *
 */
const reassign = (assignment) => (
    (dispatch) => dispatch(self._openActionModal(
        assignment,
        ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.actionName,
        ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.lock_action
    ))
);

/**
 * Action for opening modal to edit assignment's priority
 *
 */
const editPriority = (assignment) => (
    (dispatch) => dispatch(_openActionModal(
        assignment,
        ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.actionName,
        ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.lock_action,
    ))
);

/**
 * Action for saving the assignment
 * @param {Object} original - Original assignment to save
 * @param {Object} updates - Updated values
 */
const save = (original, updates) => (
    (dispatch, getState, {notify}) => (
        dispatch(assignments.api.save(original, updates))
            .then((updatedItem) => {
                notify.success(get(original, 'lock_action') === ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.lock_action ?
                    gettext('The assignment was reassigned.') :
                    gettext('Assignment priority has been updated.')
                );
                return Promise.resolve(updatedItem);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to save the assignment.'))
                );
                return Promise.reject(error);
            })
    )
);

/**
 * Action for fulfil the assignment
 * @param {Object} assignment - Assignment to link
 */
const onFulFilAssignment = (assignment) => (
    (dispatch, getState, {notify}) => {
        const newsItem = get(selectors.general.modalProps(getState()), 'newsItem', null);
        const $scope = get(selectors.general.modalProps(getState()), '$scope', null);
        const currentWorkSpace = selectors.general.currentWorkspace(getState());
        const reassign = true;

        if (currentWorkSpace !== WORKSPACE.AUTHORING || !$scope || !newsItem) {
            return Promise.resolve();
        }

        dispatch(actions.actionInProgress(true));
        return dispatch(assignments.api.link(assignment, newsItem, reassign))
            .then((item) => {
                notify.success('Assignment is fulfilled.');
                $scope.resolve();
                dispatch(actions.actionInProgress(false));
                return Promise.resolve(item);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to fulfil assignment.')
                );
                $scope.reject();
                dispatch(actions.actionInProgress(false));
                return Promise.reject(error);
            });
    }
);

function complete(item: IAssignmentItem) {
    return (dispatch, getState, {notify}) => (
        planningApi.locks.lockItem(item, 'complete')
            .then((lockedItem) => {
                dispatch(assignments.api.complete(lockedItem))
                    .then((lockedItem) => {
                        notify.success('The assignment has been completed.');
                        return Promise.resolve(lockedItem);
                    }, (error) => {
                        notify.error(getErrorMessage(error, 'Failed to complete the assignment.'));

                        // unlock the assignment
                        return planningApi.locks.unlockItem(lockedItem);
                    });
            }, (error) => Promise.reject(error))
    );
}

function revert(item: IAssignmentItem) {
    return (dispatch, getState, {notify}) => (
        planningApi.locks.lockItem(item, 'revert')
            .then((lockedItem) => {
                const contentTypes = selectors.general.contentTypes(getState());

                if (!assignmentUtils.isTextAssignment(item, contentTypes)) {
                    return dispatch(assignments.api.revert(lockedItem))
                        .then((lockedItem) => {
                            notify.success(gettext('The assignment has been reverted.'));
                            return Promise.resolve(lockedItem);
                        }, (error) => {
                            notify.error(getErrorMessage(error, gettext('Failed to revert the assignment.')));
                            return Promise.reject(error);
                        });
                }

                lockedItem.item_ids = get(item, 'item_ids', []);
                dispatch(showModal({
                    modalType: MODALS.CONFIRMATION,
                    modalProps: {
                        body: gettext('This will unlink the text item associated with the assignment. Are you sure ?'),
                        action: () => dispatch(assignments.api.unlink(lockedItem)),
                        onCancel: () => planningApi.locks.unlockItem(lockedItem),
                        autoClose: true,
                    },
                }));

                return Promise.resolve();
            }, (error) => Promise.reject(error))
    );
}

/**
 * Action for launching the modal form for fulfil assignment and add to planning
 * @param {string} action
 * @param {string} type
 * @param {object} item
 */
const onAuthoringMenuClick = (action, type, item) => (
    (dispatch, getState, {superdesk}) => {
        superdesk.intent(action, type, {item: item})
            .then(
                () => Promise.resolve(item),
                (error) => Promise.reject(error)
            );
    }
);

/**
 * Action to retrieve the associated Archive item and open the
 * Authoring panel in view mode.
 * Does nothing if there is no Archive content linked
 * @param {object} assignment - The Assignment to view content for
 */
const openArchivePreview = (assignment) => (
    (dispatch, getState, {authoringWorkspace, notify}) => (
        assignmentUtils.assignmentHasContent(assignment) ?
            dispatch(assignments.api.loadArchiveItem(assignment))
                .then((item) => {
                    dispatch(self.closePreview());
                    authoringWorkspace.view(item);
                    return Promise.resolve(item);
                }, (error) => Promise.reject(error)) :
            Promise.resolve()
    )
);

/**
 * Action for launching the full-screen preview of an Archive item
 * Uses the `superdesk` service from the client-core
 * @param {object} item - The Archive item to preview
 */
const onArchivePreviewImageClick = (item) => (
    (dispatch, getState, {superdesk}) => (
        superdesk.intent('preview', 'item', item)
    )
);

const canLinkItem = (item) => (
    (dispatch, getState, {lock, authoring, archiveService}) => (
        Promise.resolve(
            !item.assignment_id &&
            (!lock.isLocked(item) || lock.isLockedInCurrentSession(item)) &&
            !archiveService.isPersonal(item) && authoring.itemActions(item).edit
        )
    )
);

function validateStartWorkingOnScheduledUpdate(assignment: IAssignmentItem) {
    return (dispatch, getState, {notify}) => (
        // Validate the coverage to see if all preceeding scheduled_updates / coverage
        // is linked to an item
        planningApi.planning.getById(assignment.planning_item, false).then(
            (plannings) => {
                const planning = get(plannings, '[0]');

                if (!planning) {
                    notify.error(gettext('Failed to fetch planning item.'));
                    return Promise.reject();
                }

                const coverage = get(planning, 'coverages', []).find((c) =>
                    c.coverage_id === assignment.coverage_item);

                if (![ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS, ASSIGNMENTS.WORKFLOW_STATE.COMPLETED].includes(
                    get(coverage, 'assigned_to.state'))) {
                    notify.error(gettext('Parent coverage not linked to a news item yet.'));
                    return Promise.reject();
                }

                const scheduledUpdate = (get(coverage, 'scheduled_updates') || []).find((s) =>
                    s.scheduled_update_id === assignment.scheduled_update_id);
                const previousScheduledUpdateIndex = (get(coverage, 'scheduled_updates') || []).findIndex((s) => {
                    if (moment.isMoment(get(s, 'planning.scheduled')) && moment.isMoment(
                        get(scheduledUpdate, 'planning.scheduled'))) {
                        return s.planning.scheduled >= scheduledUpdate.planning.scheduled;
                    }
                    return Promise.reject();
                }) - 1;

                if (previousScheduledUpdateIndex >= 0 && ![ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS,
                    ASSIGNMENTS.WORKFLOW_STATE.COMPLETED].includes(get(
                    coverage, `scheduled_updates[${previousScheduledUpdateIndex}].assigned_to.state`))) {
                    notify.error(gettext('Previous scheduled update is not linked to a news item yet.'));
                    return Promise.reject();
                }

                return Promise.resolve();
            }
        )
    );
}

function startWorking(assignment: IAssignmentItem) {
    return (dispatch, getState, {templates, session, desks, notify}) => {
        let promise = Promise.resolve();

        if (get(assignment, 'scheduled_update_id')) {
            promise = dispatch(self.validateStartWorkingOnScheduledUpdate(assignment));
        }

        promise.then(() =>
            (planningApi.locks.lockItem(assignment, 'start_working')
                .then((lockedAssignment) => {
                    const defaultTemplateId = assignmentUtils
                        .getCurrentSelectedDesk(desks, getState())?.default_content_template ?? null;

                    return superdeskApi.entities.templates.getUserTemplates(
                        1,
                        200,
                        'create'
                    ).then((data) => {
                        let defaultTemplate = null;
                        const publicTemplates = [];
                        const privateTemplates = [];

                        (get(data, '_items') || []).forEach((template) => {
                            if (get(template, '_id') === defaultTemplateId) {
                                defaultTemplate = template;
                            } else if (get(template, 'is_public') !== false) {
                                publicTemplates.push(template);
                            } else {
                                privateTemplates.push(template);
                            }
                        });

                        const onSelect = (template) => (
                            dispatch(assignments.api.createFromTemplateAndShow(
                                assignment._id,
                                template.template_name
                            )).catch((error) => {
                                planningApi.locks.unlockItem(assignment);
                                notify.error(getErrorMessage(error, gettext('Failed to create an archive item.')));
                                return Promise.reject(error);
                            })
                        );
                        const onCancel = () => planningApi.locks.unlockItem(lockedAssignment);

                        return dispatch(showModal({
                            modalType: MODALS.SELECT_DESK_TEMPLATE,
                            modalProps: {
                                onSelect: onSelect,
                                onCancel: onCancel,
                                defaultTemplate: defaultTemplate,
                                publicTemplates: publicTemplates,
                                privateTemplates: privateTemplates,
                            },
                        }));
                    });
                }, (error) => Promise.reject(error))
            ), (error) => Promise.resolve()
        );
    };
}

function _openActionModal(assignment: IAssignmentItem, action: string, lockAction: string = 'edit') {
    return (dispatch) => (
        planningApi.locks.lockItem(assignment, lockAction)
            .then((lockedAssignment) => (
                dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        original: lockedAssignment,
                        actionType: action,
                    },
                }))
            ), (error) => Promise.reject(error))
    );
}

/**
 * Action to display the 'Remove Assignment' confirmation modal
 * Removes the assignment if 'OK' was clicked, otherwise unlocks the Assignment and
 * Planning items
 * @param {object} assignment - The Assignment item intended for deletion
 * @return Promise - Locked Assignment, otherwise the Lock API error
 */
function showRemoveAssignmentModal(assignment: IAssignmentItem) {
    return (dispatch) => (
        planningApi.locks.lockItem(assignment, ASSIGNMENTS.ITEM_ACTIONS.REMOVE.lock_action)
            .then((lockedAssignment) => {
                dispatch(showModal({
                    modalType: MODALS.CONFIRMATION,
                    modalProps: {
                        body: gettext('This will also remove other linked assignments (if any, for story updates). '
                            + 'Are you sure?'),
                        action: () => dispatch(self.removeAssignment(lockedAssignment)),
                        onCancel: () => planningApi.locks.unlockItem(lockedAssignment),
                        autoClose: true,
                    },
                }));

                return Promise.resolve(lockedAssignment);
            }, (error) => Promise.reject(error)
            )
    );
}

/**
 * Action to delete the Assignment item
 * @param {object} assignment - The Assignment item to remove
 * @return Promise - Empty promise, otherwise the API error
 */
function removeAssignment(assignment: IAssignmentItem) {
    return (dispatch, getState, {notify}) => (
        dispatch(assignments.api.removeAssignment(assignment))
            .then(() => {
                notify.success('Assignment removed');
                return Promise.resolve();
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to remove the Assignment')
                );
                planningApi.locks.unlockItem(assignment);
                return Promise.reject(error);
            })
    );
}

const setListGroups = (groupKeys) => ({
    type: ASSIGNMENTS.ACTIONS.SET_GROUP_KEYS,
    payload: groupKeys,
});

/**
 * Action dispatcher to set the list sort order in redux
 * @param {String} list - The list group key
 * @param {String} sortOrder - The sort order to use ('Asc' or 'Desc')
 */
const setListSortOrder = (list, sortOrder) => ({
    type: ASSIGNMENTS.ACTIONS.SET_GROUP_SORT_ORDER,
    payload: {list, sortOrder},
});

/**
 * Action dispatcher to change the list sort order and reload the list of assignments
 * (optionally saves to user preferences)
 * @param {String} list - The list group key
 * @param {String} sortOrder - The sort order to use ('Asc' or 'Desc')
 * @param {boolean} savePreference - If true, save the list sort order to the current users' preferences
 */
const changeListSortOrder = (list, sortOrder, savePreference = true) => (
    (dispatch) => {
        dispatch(self.setListSortOrder(list, sortOrder));

        if (savePreference) {
            dispatch(actions.users.setAssignmentSortOrder(list, sortOrder));
        }

        return dispatch(self.reloadAssignmentList(list, false));
    }
);

/**
 * Action dispatcher to set the field to sort by for all lists
 * @param {String} field - The name of the field to sort by
 */
const setSortField = (field) => ({
    type: ASSIGNMENTS.ACTIONS.SET_SORT_FIELD,
    payload: field,
});

/**
 * Action dispatcher to change the field to sort by for all lists and reload all lists of assignments
 * (optionally saves to user preferences)
 * @param {String} field - The name of the field to sort by
 * @param {boolean} savePreference - If true, save the sort field to the current users' preferences
 * @returns {Promise} - A promise with the result of the reloadAssignments action
 */
const changeSortField = (field, savePreference = true) => (
    (dispatch) => {
        dispatch(self.setSortField(field));

        if (savePreference) {
            dispatch(actions.users.setAssignmentSortField(field));
        }

        return dispatch(self.reloadAssignments(null, false));
    }
);

/**
 * Action dispatcher to set the day field filter for all lists
 * @param {String} value - the value to set the field to
 */
const setDayField = (value) => ({
    type: ASSIGNMENTS.ACTIONS.SET_DAY_FIELD,
    payload: value,
});

const changeDayField = (value, savePreference = true) => (
    (dispatch) => {
        dispatch(self.setDayField(value));

        // if (savePreference) {
        //     dispatch(actions.users.setAssignmentSortField());
        // }

        return dispatch(self.reloadAssignments(null, false));
    }
);

/**
 * Action dispatcher to load the current users' preferred sort field and list orders
 * (This assumes the users' preferences have already been loaded into redux)
 */
const loadDefaultListSort = () => (
    (dispatch, getState) => {
        const defaultSort = get(
            selectors.general.preferredAssignmentSort(getState()),
            'sort',
            {}
        );

        dispatch(self.setSortField(get(defaultSort, 'field') || 'Scheduled'));

        forEach(get(defaultSort, 'order') || {}, (order, list) => {
            dispatch(self.setListSortOrder(list, order));
        });
    }
);

/**
 * Show the Coverage Assignment modal
 * @param {string} field - The field to edit in the item
 * @param {Object} value - The item to edit
 * @param {Function} onChange - onChange callback
 * @param {string} priorityPrefix - The prefix for the priority field
 * @param {boolean} disableDeskSelection - If true, disables the Desk input field
 * @param {boolean} disableUserSelection - If true, disables the User input field
 * @param {Function} setCoverageDefaultDesk - Callback function to set default desk for coverages
 */
const showEditCoverageAssignmentModal = ({
    field,
    value,
    onChange,
    priorityPrefix,
    disableDeskSelection,
    disableUserSelection,
    setCoverageDefaultDesk,
}) => (
    (dispatch) => {
        dispatch(showModal({
            modalType: MODALS.EDIT_COVERAGE_ASSIGNMENT,
            modalProps: {
                field,
                value,
                onChange,
                priorityPrefix,
                disableDeskSelection,
                disableUserSelection,
                setCoverageDefaultDesk,
            },
        }));
    }
);

// eslint-disable-next-line consistent-this
const self = {
    loadAssignments,
    queryAndGetMyAssignments,
    queryAndSetAssignmentListGroups,
    changeListSettings,
    reloadAssignments,
    reloadAssignmentList,
    loadMoreAssignments,
    preview,
    closePreview,
    setAssignmentListGroup,
    changeLastAssignmentLoadedPage,
    changeAssignmentListSingleGroupView,
    reassign,
    editPriority,
    save,
    onFulFilAssignment,
    complete,
    revert,
    onAuthoringMenuClick,
    canLinkItem,
    _openActionModal,
    startWorking,
    addToAssignmentListGroup,
    onArchivePreviewImageClick,
    showRemoveAssignmentModal,
    removeAssignment,
    updatePreviewItemOnRouteUpdate,
    openArchivePreview,
    setMyAssignmentsTotal,
    setListGroups,
    loadFulfillModal,
    previewFirstInListGroup,
    setListSortOrder,
    changeListSortOrder,
    setSortField,
    setDayField,
    changeDayField,
    loadDefaultListSort,
    changeSortField,
    validateStartWorkingOnScheduledUpdate,
    showEditCoverageAssignmentModal,
    setLoading,
};

export default self;
