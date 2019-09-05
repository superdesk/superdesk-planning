import {showModal} from '../index';
import assignments from './index';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS, MODALS, WORKSPACE, ALL_DESKS} from '../../constants';
import {getErrorMessage, assignmentUtils, gettext} from '../../utils';
import {get, cloneDeep} from 'lodash';

/**
 * Action dispatcher to load the list of assignments for current list settings.
 * @param {String} filterBy - the filter by desk or user ('Desk', 'User')
 * @param {String} searchQuery - the text used for free text query
 * @param {String} orderByField - the field used to order the assignments ('Created', 'Updated')
 * @param {String} orderDirection - the direction of order ('Asc', 'Desc')
 * @param {String} filterByType - Type of the assignment
 * @param {String} filterByPriority - The priority to filter for
 * @param {String} selectedDeskId - The Desk ID
 */
const loadAssignments = ({
    filterBy = 'Desk',
    searchQuery = null,
    orderByField = 'Scheduled',
    orderDirection = 'Asc',
    filterByType = null,
    filterByPriority = null,
    selectedDeskId = null,
}) => (dispatch) => {
    dispatch(
        self.changeListSettings({
            filterBy,
            searchQuery,
            orderByField,
            orderDirection,
            filterByType,
            filterByPriority,
            selectedDeskId,
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
            orderDirection: 'Asc',
            filterByType: get(item, 'type'),
            filterByPriority: null,
            selectedDeskId: ALL_DESKS,
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

        listGroups.forEach((key) => {
            const group = ASSIGNMENTS.LIST_GROUPS[key];

            if (resetPage) {
                dispatch(self.changeLastAssignmentLoadedPage(group));
            }

            dispatches.push(dispatch(self.queryAndSetAssignmentListGroups(key)));
        });

        return Promise.all(dispatches);
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
        let querySearchSettings = cloneDeep(selectors.getAssignmentSearch(getState()));
        const group = ASSIGNMENTS.LIST_GROUPS[groupKey];

        querySearchSettings.states = group.states;
        querySearchSettings.page = page;
        querySearchSettings.dateFilter = group.dateFilter;

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
            });
    }
);


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
 * @param {string} orderDirection - the direction of order ('Asc', 'Desc')
 * @param {string} filterByPriority - Priority of the assignment
 * @param {string} filterByType - Type of the assignment
 * @param {string} selectedDeskId - Desk Id
 * @return object
 */
const changeListSettings = ({
    filterBy = 'Desk',
    searchQuery = null,
    orderByField = 'Scheduled',
    orderDirection = 'Asc',
    filterByType = null,
    filterByPriority = null,
    selectedDeskId = null,
}) => ({
    type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
    payload: {
        filterBy,
        searchQuery,
        orderByField,
        orderDirection,
        filterByType,
        filterByPriority,
        selectedDeskId,
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
 * @param {Object} original - Original assignment to save
 * @param {Object} updates - Updated values
 */
const save = (original, updates) => (
    (dispatch, getState, {notify}) => (
        dispatch(assignments.api.save(original, updates))
            .then((updatedItem) => {
                notify.success(get(original, 'lock_action') === 'reassign' ?
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
                        onCancel: () => dispatch(self.unlockAssignment(lockedItem)),
                        autoClose: true,
                    },
                }));

                return Promise.resolve();
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
    (dispatch, getState, {templates, session, desks, notify}) => (
        dispatch(self.lockAssignment(assignment, 'start_working'))
            .then((lockedAssignment) => {
                const currentDesk = desks.getCurrentDesk();
                const defaultTemplateId = get(currentDesk, 'default_content_template') || null;

                return templates.fetchTemplatesByUserDesk(
                    session.identity._id,
                    get(currentDesk, '_id') || null,
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
                            dispatch(self.unlockAssignment(assignment));
                            notify.error(getErrorMessage(error, gettext('Failed to create an archive item.')));
                            return Promise.reject(error);
                        })
                    );

                    const onCancel = () => (
                        dispatch(assignments.api.unlock(lockedAssignment))
                    );

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
    )
);

const _openActionModal = (assignment, action, lockAction = null) => (
    (dispatch) => (
        dispatch(self.lockAssignment(assignment, lockAction))
            .then((lockedAssignment) => (
                dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        original: lockedAssignment,
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
    (dispatch) => {
        let planning = null;

        return dispatch(self.lockPlanning(assignment, action))
            .then(
                (lockedPlan) => {
                    planning = lockedPlan;
                    return dispatch(self.lockAssignment(assignment, action));
                }
            )
            .then(
                (lockedItem) => Promise.resolve(lockedItem),
                (error) => {
                    if (!planning) {
                        return Promise.reject(error);
                    }
                    return dispatch(self.unlockPlanning(assignment))
                        .then(
                            () => Promise.reject(error),
                            () => Promise.reject(error)
                        );
                }
            );
    }
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
                        getErrorMessage(error, 'Failed to unlock the Planning item')
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
        dispatch(self.lockAssignmentAndPlanning(assignment, ASSIGNMENTS.ITEM_ACTIONS.REMOVE.lock_action))
            .then((lockedAssignment) => {
                dispatch(showModal({
                    modalType: MODALS.CONFIRMATION,
                    modalProps: {
                        body: 'Are you sure you want to remove the Assignment?',
                        action: () => dispatch(self.removeAssignment(lockedAssignment)),
                        onCancel: () => dispatch(self.unlockAssignmentAndPlanning(lockedAssignment)),
                        autoClose: true,
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

const setListGroups = (groupKeys) => ({
    type: ASSIGNMENTS.ACTIONS.SET_GROUP_KEYS,
    payload: groupKeys,
});

// eslint-disable-next-line consistent-this
const self = {
    loadAssignments,
    queryAndGetMyAssignments,
    queryAndSetAssignmentListGroups,
    changeListSettings,
    reloadAssignments,
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
    openSelectTemplateModal,
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
    setMyAssignmentsTotal,
    setListGroups,
    loadFulfillModal,
    previewFirstInListGroup,
};

export default self;
