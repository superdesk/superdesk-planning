import {showModal} from '../index';
import assignments from './index';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS, MODALS, WORKSPACE} from '../../constants';
import {getErrorMessage, assignmentUtils, gettext} from '../../utils';
import {get} from 'lodash';

/**
 * Action dispatcher to load the list of assignments for current list settings.
 * @param {string} filterBy - the filter by desk or user ('All', 'User')
 * @param {string} searchQuery - the text used for free text query
 * @param {string} orderByField - the field used to order the assignments ('Created', 'Updated')
 * @param {string} orderDirection - the direction of order ('Asc', 'Desc')
 * @param {string} filterByState - State of the assignment
 * @param {string} filterByType - Type of the assignment
 */
const loadAssignments = (
    filterBy,
    searchQuery,
    orderByField,
    orderDirection,
    filterByState = null,
    filterByType = null
) => (dispatch) => {
    dispatch(
        self.changeListSettings(filterBy, searchQuery,
            orderByField, orderDirection, filterByType)
    );
    return dispatch(queryAndSetAssignmentListGroups(filterByState));
};

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const reloadAssignments = (filterByState) => (
    (dispatch, getState) => {
        if (!filterByState || filterByState.length <= 0) {
            // Load all assignment groups
            let dispatches = [];

            Object.keys(ASSIGNMENTS.LIST_GROUPS).forEach((key) => {
                const states = ASSIGNMENTS.LIST_GROUPS[key].states;

                dispatch(self.changeLastAssignmentLoadedPage(states));
                dispatches.push(dispatch(self.queryAndSetAssignmentListGroups(states)));
            });

            return Promise.all(dispatches);
        } else {
            dispatch(self.changeLastAssignmentLoadedPage(
                assignmentUtils.getAssignmentGroupByStates(filterByState)));
            return dispatch(queryAndSetAssignmentListGroups(filterByState));
        }
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
                            const currentUserId = selectors.getCurrentUserId(getState());
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

const queryAndSetAssignmentListGroups = (filterByState, page = 1) => (
    (dispatch, getState) => {
        let querySearchSettings = selectors.getAssignmentSearch(getState());
        const listGroupForStates = assignmentUtils.getAssignmentGroupByStates(filterByState);

        querySearchSettings.states = listGroupForStates.states;
        querySearchSettings.page = page;

        return dispatch(assignments.api.query(querySearchSettings))
            .then((data) => {
                dispatch(assignments.api.receivedAssignments(data._items));
                if (page == 1) {
                    dispatch(self.setAssignmentListGroup(data._items.map((a) => a._id),
                        get(data, '_meta.total'), listGroupForStates));
                } else {
                    dispatch(self.addToAssignmentListGroup(data._items.map((a) => a._id),
                        listGroupForStates));
                }

                return Promise.resolve(data._items);
            });
    }
);

/**
 * Action dispatcher to load the next page of assignments.
 */
const loadMoreAssignments = (filterByState) => (
    (dispatch, getState) => {
        const listGroup = assignmentUtils.getAssignmentGroupByStates(filterByState);
        let lastLoadedPageForListGroup;

        switch (listGroup.label) {
        case ASSIGNMENTS.LIST_GROUPS.TODO.label:
            lastLoadedPageForListGroup = selectors.getAssignmentTodoListPage(getState());
            break;

        case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
            lastLoadedPageForListGroup = selectors.getAssignmentInProgressPage(getState());
            break;

        case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
            lastLoadedPageForListGroup = selectors.getAssignmentCompletedPage(getState());
            break;
        }

        const previousSearch = selectors.getAssignmentSearch(getState());
        const search = {
            ...previousSearch,
            page: lastLoadedPageForListGroup + 1 || 1,
        };

        dispatch(changeLastAssignmentLoadedPage(listGroup, search.page));
        return dispatch(queryAndSetAssignmentListGroups(filterByState, search.page));
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
 * @param {number} lastAssignmentLoadedPage - the last loaded page
 * @return object
 */
const changeLastAssignmentLoadedPage = (listGroup, pageNum = 1) => (
    (dispatch) => {
        let changeLastAssignmentPayload;

        switch (listGroup.label) {
        case ASSIGNMENTS.LIST_GROUPS.TODO.label:
            changeLastAssignmentPayload = {todoListLastLoadedPage: pageNum};
            break;

        case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
            changeLastAssignmentPayload = {inProgressListLastLoadedPage: pageNum};
            break;

        case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
            changeLastAssignmentPayload = {completedListLastLoadedPage: pageNum};
            break;
        }

        return dispatch({
            type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
            payload: changeLastAssignmentPayload,
        });
    }
);

/**
 * Action to change the filter&search for the list of Assignments
 * @param {string} filterBy - the filter by desk or user ('All', 'User')
 * @param {string} searchQuery - the text used for free text query
 * @param {string} orderByField - the field used to order the assignments ('Created', 'Updated')
 * @param {string} orderDirection - the direction of order ('Asc', 'Desc')
 * @param {string} filterByState - State of the assignment
 * @param {string} filterByType - Type of the assignment
 * @return object
 */
const changeListSettings = (filterBy, searchQuery, orderByField,
    orderDirection, filterByType = null) => ({
    type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
    payload: {
        filterBy,
        searchQuery,
        orderByField,
        orderDirection,
        filterByType,
    },
});

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const setAssignmentListGroup = (assignments, totalNoOfItems, group) => (
    (dispatch) => {
        switch (group.label) {
        case ASSIGNMENTS.LIST_GROUPS.TODO.label:
            return dispatch(self.setAssignmentsTodoList(assignments, totalNoOfItems));

        case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
            return dispatch(self.setAssignmentsInProgressList(assignments, totalNoOfItems));

        case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
            return dispatch(self.setAssignmentsInCompletedList(assignments, totalNoOfItems));
        }
        return Promise.resolve();
    }
);

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const addToAssignmentListGroup = (assignments, group) => (
    (dispatch) => {
        let actionType;

        switch (group.label) {
        case ASSIGNMENTS.LIST_GROUPS.TODO.label:
            actionType = ASSIGNMENTS.ACTIONS.ADD_TO_TODO_LIST;
            break;

        case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
            actionType = ASSIGNMENTS.ACTIONS.ADD_TO_IN_PROGRESS_LIST;
            break;

        case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
            actionType = ASSIGNMENTS.ACTIONS.ADD_TO_COMPLETED_LIST;
            break;
        }

        return dispatch({
            type: actionType,
            payload: assignments,
        });
    }
);

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
 * Action that sets the list of visible assignments items
 * Toggle the current selection of on assignment
 * @param {object} assignemnt - The Assignment to toggle
 * @param {object} value - The toggle value
 */
const toggleAssignmentSelection = ({assignment, value}) => (
    {
        type: value ? ASSIGNMENTS.ACTIONS.SELECT_ASSIGNMENTS
            : ASSIGNMENTS.ACTIONS.DESELECT_ASSIGNMENT,
        payload: value ? [assignment] : assignment,
    }
);

/**
 * Action that sets the list of assignments items in to-do state
 * @param {Array} ids - An array of assignments item ids
 */
const setAssignmentsTodoList = (ids, totalNoOfItems) => ({
    type: ASSIGNMENTS.ACTIONS.SET_TODO_LIST,
    payload: {
        ids: [...ids],
        total: totalNoOfItems,
    },
});

/**
 * Action that sets the list of assignments items in in-progress state
 * @param {Array} ids - An array of assignments item ids
 */
const setAssignmentsInProgressList = (ids, totalNoOfItems) => ({
    type: ASSIGNMENTS.ACTIONS.SET_IN_PROGRESS_LIST,
    payload: {
        ids: [...ids],
        total: totalNoOfItems,
    },
});

/**
 * Action that sets the list of assignments items in complete state
 * @param {Array} ids - An array of assignments item ids
 */
const setAssignmentsInCompletedList = (ids, totalNoOfItems) => ({
    type: ASSIGNMENTS.ACTIONS.SET_COMPLETED_LIST,
    payload: {
        ids: [...ids],
        total: totalNoOfItems,
    },
});

/**
 * Action for opening modal to reassign
 *
 */
const reassign = (assignment) => (
    (dispatch) => dispatch(self._openActionModal(
        assignment,
        ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.label,
        'reassign'
    ))
);

/**
 * Action for opening modal to edit assignment's priority
 *
 */
const editPriority = (assignment) => (
    (dispatch) => dispatch(_openActionModal(
        assignment,
        ASSIGNMENTS.ITEM_ACTIONS.EDIT_PRIORITY.label,
        'edit_priority'
    ))
);

/**
 * Action for saving the assignment
 * @param {Object} item - Assignment to Save
 */
const save = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(assignments.api.save(item))
            .then((updatedItem) => {
                notify.success(get(item, 'lock_action') === 'reassign' ?
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
 * Action for saving the assignment
 * @param {Object} item - Assignment to Save
 */
const onAssignmentFormSave = (item) => (
    (dispatch, getState) => {
        const currentWorkSpace = selectors.getCurrentWorkspace(getState());

        if (currentWorkSpace === WORKSPACE.AUTHORING) {
            return dispatch(self.onFulFilAssignment(item));
        }

        return dispatch(self.save(item));
    }
);

/**
 * Action for fulfil the assignment
 * @param {Object} assignment - Assignment to link
 */
const onFulFilAssignment = (assignment) => (
    (dispatch, getState, {notify}) => {
        const {$scope, newsItem} = selectors.getCurrentModalProps(getState());
        const currentWorkSpace = selectors.getCurrentWorkspace(getState());

        if (currentWorkSpace !== WORKSPACE.AUTHORING || !$scope || !newsItem) {
            return Promise.resolve();
        }

        dispatch(actions.actionInProgress(true));
        return dispatch(assignments.api.link(assignment, newsItem))
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

const complete = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(self.lockAssignment(item, 'complete'))
            .then((lockedItem) => {
                dispatch(assignments.api.complete(lockedItem))
                    .then((lockedItem) => {
                        notify.success('The assignment has been completed.');
                        return Promise.resolve(lockedItem);
                    }, (error) => {
                        notify.error('Failed to complete the assignment.');
                        return Promise.reject(error);
                    });
            }, (error) => Promise.reject(error))
    )
);

const revert = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(self.lockAssignment(item, 'revert'))
            .then((lockedItem) => {
                dispatch(assignments.api.revert(lockedItem))
                    .then((lockedItem) => {
                        notify.success(gettext('The assignment has been reverted.'));
                        return Promise.resolve(lockedItem);
                    }, (error) => {
                        notify.error(getErrorMessage(error, gettext('Failed to revert the assignment.')));
                        return Promise.reject(error);
                    });
            }, (error) => Promise.reject(error))
    )
);

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

const openSelectTemplateModal = (assignment) => (
    (dispatch, getState) => (
        dispatch(self.lockAssignment(assignment, 'start_working'))
            .then((lockedAssignment) => {
                let items = [];
                const templates = selectors.getTemplates(getState());

                templates.forEach((t) => {
                    items.push({
                        value: t,
                        label: t.template_name,
                    });
                });

                const onSelect = (template) => (
                    dispatch(assignments.api.createFromTemplateAndShow(assignment._id,
                        template.template_name))
                );

                const onCancel = () => (
                    dispatch(assignments.api.unlock(lockedAssignment))
                );

                return dispatch(showModal({
                    modalType: MODALS.SELECT_ITEM_MODAL,
                    modalProps: {
                        title: 'Select template',
                        items: items,
                        onSelect: onSelect,
                        onCancel: onCancel,
                    },
                }));
            }, (error) => Promise.reject(error))
    )
);

const _openActionModal = (assignment, action, lockAction = null) => (
    (dispatch) => (
        dispatch(self.lockAssignment(assignment, lockAction))
            .then((lockedAssignment) => (
                dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        assignment: lockedAssignment,
                        actionType: action,
                    },
                }))
            ), (error) => Promise.reject(error))
    )
);

/**
 * Utility Action to lock the Assignment, and display a notification
 * to the user if the lock fails
 * @param {object} assignment - The Assignment to lock
 * @param {string} action - The action for the lock
 * @return Promise - The locked Assignment item, otherwise the API error
 */
const lockAssignment = (assignment, action) => (
    (dispatch, getState, {notify}) => (
        dispatch(assignments.api.lock(assignment, action))
            .then(
                (lockedAssignment) => Promise.resolve(lockedAssignment),
                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to lock the Assignment.')
                    );

                    return Promise.reject(error);
                }
            )
    )
);

/**
 * Utility Action to lock a Planning item associated with an Assignment, and
 * displays a notification to the user if the lock fails
 * @param {object} assignment - The Assignment for the associated Planning item
 * @param {string} action - The action for the lock
 * @return Promise - The locked Planning item, otherwise the API error
 */
const lockPlanning = (assignment, action) => (
    (dispatch, getState, {notify}) => (
        dispatch(actions.planning.api.lock({_id: get(assignment, 'planning_item')}, action))
            .then(
                (lockedPlanning) => Promise.resolve(lockedPlanning),
                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to lock the Planning item.')
                    );

                    return Promise.reject(error);
                }
            )
    )
);

/**
 * Utility Action to lock both the Assignment and it's associated Planning item
 * @param {object} assignment - The Assignment to lock for
 * @param {string} action - The action for the lock
 * @return Promise - The locked Assignment item, otherwise the API error
 */
const lockAssignmentAndPlanning = (assignment, action) => (
    (dispatch) => (
        Promise.all([
            dispatch(self.lockAssignment(assignment, action)),
            dispatch(self.lockPlanning(assignment, action)),
        ])
            .then(
                (data) => Promise.resolve(data[0]),
                (error) => Promise.reject(error)
            )
    )
);

/**
 * Utility Action to unlock an Assignment and display a notification
 * if the unlock fails
 * @param {object} assignment - The Assignment to unlock
 * @return Promise - The unlocked Assignment item, otherwise the API error
 */
const unlockAssignment = (assignment) => (
    (dispatch, getState, {notify}) => (
        dispatch(assignments.api.unlock(assignment))
            .then(
                (unlockedAssignment) => Promise.resolve(unlockedAssignment),
                (error) => {
                    notify.error(
                        getErrorMessage(error, gettext('Failed to unlock the Assignment'))
                    );

                    return Promise.reject(error);
                }
            )
    )
);

/**
 * Utility Action to unlock a Planning item associated with an Assignment, and
 * display a notification to the user if the unlock fails
 * @param assignment
 * @return Promise - The unlocked Planning item, otherwise the API error
 */
const unlockPlanning = (assignment) => (
    (dispatch, getState, {notify}) => (
        dispatch(actions.planning.api.unlock({_id: get(assignment, 'planning_item')}))
            .then(
                (unlockedPlanning) => Promise.resolve(unlockedPlanning),
                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to lock the Planning item')
                    );

                    return Promise.reject(error);
                }
            )
    )
);

/**
 * Utility Action to unlock both the Assignment and it's associated Planning item
 * @param {object} assignment - The Assignment to lock for
 * @return Promise - The unlocked Assignment item, otherwise the API error
 */
const unlockAssignmentAndPlanning = (assignment) => (
    (dispatch) => (
        Promise.all([
            dispatch(self.unlockAssignment(assignment)),
            dispatch(self.unlockPlanning(assignment)),
        ])
            .then(
                (data) => Promise.resolve(data[0]),
                (error) => Promise.reject(error)
            )
    )
);

/**
 * Action to display the 'Remove Assignment' confirmation modal
 * Removes the assignment if 'OK' was clicked, otherwise unlocks the Assignment and
 * Planning items
 * @param {object} assignment - The Assignment item intended for deletion
 * @return Promise - Locked Assignment, otherwise the Lock API error
 */
const showRemoveAssignmentModal = (assignment) => (
    (dispatch) => (
        dispatch(self.lockAssignmentAndPlanning(assignment, 'remove_assignment'))
            .then((lockedAssignment) => {
                dispatch(showModal({
                    modalType: MODALS.CONFIRMATION,
                    modalProps: {
                        body: 'Are you sure you want to remove the Assignment?',
                        action: () => dispatch(self.removeAssignment(lockedAssignment)),
                        onCancel: () => dispatch(self.unlockAssignmentAndPlanning(lockedAssignment)),
                    },
                }));

                return Promise.resolve(lockedAssignment);
            }, (error) => Promise.reject(error)
            )
    )
);

/**
 * Action to delete the Assignment item
 * @param {object} assignment - The Assignment item to remove
 * @return Promise - Empty promise, otherwise the API error
 */
const removeAssignment = (assignment) => (
    (dispatch, getState, {notify}) => (
        dispatch(assignments.api.removeAssignment(assignment))
            .then(() => {
                notify.success('Assignment removed');
                return Promise.resolve();
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to remove the Assignment')
                );

                return Promise.reject(error);
            })
    )
);

// eslint-disable-next-line consistent-this
const self = {
    loadAssignments,
    queryAndSetAssignmentListGroups,
    changeListSettings,
    reloadAssignments,
    loadMoreAssignments,
    preview,
    closePreview,
    toggleAssignmentSelection,
    setAssignmentListGroup,
    setAssignmentsTodoList,
    setAssignmentsInProgressList,
    setAssignmentsInCompletedList,
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
    openSelectTemplateModal,
    onAssignmentFormSave,
    addToAssignmentListGroup,
    onArchivePreviewImageClick,
    showRemoveAssignmentModal,
    removeAssignment,
    updatePreviewItemOnRouteUpdate,
    lockAssignment,
    lockPlanning,
    lockAssignmentAndPlanning,
    unlockAssignment,
    unlockPlanning,
    unlockAssignmentAndPlanning,
    openArchivePreview,
};

export default self;
