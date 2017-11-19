import { showModal, hideModal } from '../index'
import assignments from './index'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { ASSIGNMENTS, MODALS, WORKSPACE } from '../../constants'
import { getErrorMessage, assignmentUtils } from '../../utils'
import { get } from 'lodash'

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
    filterByState=null,
    filterByType=null
) => (dispatch) => {
        dispatch(
            self.changeListSettings(filterBy, searchQuery,
                orderByField, orderDirection, filterByType)
        )
        return dispatch(queryAndSetAssignmentListGroups(filterByState))
    }

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const reloadAssignments = (filterByState) => (
    (dispatch) => {
        if (!filterByState || filterByState.length <= 0) {
            // Load all assignment groups
            Object.keys(ASSIGNMENTS.LIST_GROUPS).forEach((key) => {
                const states = ASSIGNMENTS.LIST_GROUPS[key].states

                dispatch(self.changeLastAssignmentLoadedPage(states))
                dispatch(queryAndSetAssignmentListGroups(states))
            })
        } else {
            dispatch(self.changeLastAssignmentLoadedPage(
                assignmentUtils.getAssignmentGroupByStates(filterByState)))
            return dispatch(queryAndSetAssignmentListGroups(filterByState))
        }

        return Promise.resolve()
    }
)

const queryAndSetAssignmentListGroups = (filterByState, page=1) => (
    (dispatch, getState) => {
        let querySearchSettings = selectors.getAssignmentSearch(getState())
        if (filterByState) {
            querySearchSettings.states = filterByState
        }

        querySearchSettings.page = page

        return dispatch(assignments.api.query(querySearchSettings))
        .then((data) => {
            dispatch(assignments.api.receivedAssignments(data._items))

            const listGroup = assignmentUtils.getAssignmentGroupByStates(querySearchSettings.states)
            if (page == 1) {
                dispatch(self.setAssignmentListGroup(data._items.map((a) => a._id),
                get(data, '_meta.total'), listGroup))
            } else {
                dispatch(self.addToAssignmentListGroup(data._items.map((a) => a._id),
                    listGroup))
            }

            return Promise.resolve(data._items)
        })
    }
)

/**
 * Action dispatcher to load the next page of assignments.
 */
const loadMoreAssignments = (filterByState) => (
    (dispatch, getState) => {
        const listGroup = assignmentUtils.getAssignmentGroupByStates(filterByState)
        let lastLoadedPageForListGroup

        switch (listGroup.label) {
            case ASSIGNMENTS.LIST_GROUPS.TODO.label:
                lastLoadedPageForListGroup = selectors.getAssignmentTodoListPage(getState())
                break

            case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
                lastLoadedPageForListGroup = selectors.getAssignmentInProgressPage(getState())
                break

            case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
                lastLoadedPageForListGroup = selectors.getAssignmentCompletedPage(getState())
                break
        }

        const previousSearch = selectors.getAssignmentSearch(getState())
        const search = {
            ...previousSearch,
            page: lastLoadedPageForListGroup + 1 || 1,
        }

        dispatch(changeLastAssignmentLoadedPage(listGroup, search.page))
        return dispatch(queryAndSetAssignmentListGroups(filterByState, search.page))
    }
)

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const changeAssignmentListSingleGroupView = (groupKey) => (
    (dispatch, getState) => {
        let assignmentListSingleGroupView = selectors.getAssignmentListSingleGroupView(getState())

        if (!assignmentListSingleGroupView && groupKey) {
            assignmentListSingleGroupView = groupKey
        } else if (assignmentListSingleGroupView) {
            assignmentListSingleGroupView = null
        }

        dispatch({
            type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_VIEW_MODE,
            payload: assignmentListSingleGroupView,
        })
    }
)

/**
 * Action to change the last loaded page for the list of Assignments
 * @param {number} lastAssignmentLoadedPage - the last loaded page
 * @return object
 */
const changeLastAssignmentLoadedPage = (listGroup, pageNum=1) => (
    (dispatch) => {
        let changeLastAssignmentPayload
        switch (listGroup.label) {
            case ASSIGNMENTS.LIST_GROUPS.TODO.label:
                changeLastAssignmentPayload = { todoListLastLoadedPage: pageNum }
                break

            case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
                changeLastAssignmentPayload = { inProgressListLastLoadedPage: pageNum }
                break

            case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
                changeLastAssignmentPayload = { completedListLastLoadedPage: pageNum }
                break
        }

        return dispatch({
            type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
            payload: changeLastAssignmentPayload,
        })
    }
)

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
                            orderDirection, filterByType=null) => ({
    type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
    payload: {
        filterBy,
        searchQuery,
        orderByField,
        orderDirection,
        filterByType,
    },
})

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const setAssignmentListGroup = (assignments, totalNoOfItems, group) => (
    (dispatch) => {
        switch (group.label) {
            case ASSIGNMENTS.LIST_GROUPS.TODO.label:
                return dispatch(self.setAssignmentsTodoList(assignments, totalNoOfItems))

            case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
                return dispatch(self.setAssignmentsInProgressList(assignments, totalNoOfItems))

            case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
                return dispatch(self.setAssignmentsInCompletedList(assignments, totalNoOfItems))
        }
        return Promise.resolve()
    }
)

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const addToAssignmentListGroup = (assignments, group) => (
    (dispatch) => {
        let actionType
        switch (group.label) {
            case ASSIGNMENTS.LIST_GROUPS.TODO.label:
                actionType = ASSIGNMENTS.ACTIONS.ADD_TO_TODO_LIST
                break

            case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
                actionType = ASSIGNMENTS.ACTIONS.ADD_TO_IN_PROGRESS_LIST
                break

            case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
                actionType = ASSIGNMENTS.ACTIONS.ADD_TO_COMPLETED_LIST
                break
        }

        return dispatch({
            type: actionType,
            payload: assignments,
        })
    }
)

/**
 * Open assignment in preview mode
 * @param {object} assignment - The Assignment to preview
 * @return object
 */
const preview = (assignment) => (
    {
        type: ASSIGNMENTS.ACTIONS.PREVIEW_ASSIGNMENT,
        payload: assignment,
    }
)

/**
 * Close the preview assignment
 * @return object
 */
const closePreview = () => (
    { type: ASSIGNMENTS.ACTIONS.CLOSE_PREVIEW_ASSIGNMENT }
)

/**
 * Action that sets the list of visible assignments items
 * Toggle the current selection of on assignment
 * @param {object} assignemnt - The Assignment to toggle
 * @param {object} value - The toggle value
 */
const toggleAssignmentSelection = ({ assignment, value }) => (
    {
        type: value ? ASSIGNMENTS.ACTIONS.SELECT_ASSIGNMENTS
            : ASSIGNMENTS.ACTIONS.DESELECT_ASSIGNMENT,
        payload: value ? [assignment] : assignment,
    }
)

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
})

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
})

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
})

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
)

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
)

/**
 * Action for saving the assignment
 * @param {Object} item - Assignment to Save
 */
const save = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(assignments.api.save(item))
        .then((updatedItem) => {
            dispatch(hideModal())
            let msg = 'Assignment priority has been updated.'
            if (item.lock_action === 'reassign') {
                msg = 'The assignment was reassigned.'
            }

            notify.success(msg)
            return Promise.resolve(updatedItem)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to save the assignment.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Action for saving the assignment
 * @param {Object} item - Assignment to Save
 */
const onAssignmentFormSave = (item) => (
    (dispatch, getState) => {
        const currentWorkSpace = selectors.getCurrentWorkspace(getState())
        if (currentWorkSpace === WORKSPACE.AUTHORING) {
            return dispatch(self.onFulFilAssignment(item))
        }

        return dispatch(self.save(item))
    }
)

/**
 * Action for fulfil the assignment
 * @param {Object} assignment - Assignment to link
 */
const onFulFilAssignment = (assignment) => (
    (dispatch, getState, { notify }) => {
        const { $scope, newsItem } = selectors.getCurrentModalProps(getState())
        const currentWorkSpace = selectors.getCurrentWorkspace(getState())

        if (currentWorkSpace !== WORKSPACE.AUTHORING || !$scope || !newsItem) {
            return Promise.resolve()
        }

        dispatch(actions.actionInProgress(true))
        return dispatch(assignments.api.link(assignment, newsItem))
        .then((item) => {
            notify.success('Assignment is fulfilled.')
            $scope.resolve()
            dispatch(actions.actionInProgress(false))
            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to fulfil assignment.')
            )
            $scope.reject()
            dispatch(actions.actionInProgress(false))
            return Promise.reject(error)
        })
    }
)

const complete = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(assignments.api.lock(item, 'complete'))
        .then((lockedItem) => {
            dispatch(assignments.api.complete(lockedItem))
            .then((lockedItem) => {
                notify.success('The assignment has been completed.')
                return Promise.resolve(lockedItem)
            }, (error) => {
                notify.error('Failed to complete the assignment.')
                return Promise.reject(error)
            })
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to lock assignment.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Action for launching the modal form for fulfil assignment and add to planning
 * @param {string} action
 * @param {string} type
 * @param {object} item
 */
const onAuthoringMenuClick = (action, type, item) => (
    (dispatch, getState, { superdesk }) => {
        superdesk.intent(action, type, { item: item })
        .then(
            () => Promise.resolve(item),
            (error) => Promise.reject(error)
        )
    }
)

const canLinkItem = (item) => (
    (dispatch, getState, { lock, authoring, archiveService }) => (
        Promise.resolve(
            !item.assignment_id &&
            (!lock.isLocked(item) || lock.isLockedInCurrentSession(item)) &&
            !archiveService.isPersonal(item) && authoring.itemActions(item).edit
        )
    )
)

const openSelectTemplateModal = (assignment) => (
    (dispatch, getState, { notify }) => (
        dispatch(assignments.api.lock(assignment, 'start_working'))
        .then((lockedAssignment) => {
            let items = []
            const templates = selectors.getTemplates(getState())

            templates.forEach((t) => {
                items.push({
                    value: t,
                    label: t.template_name,
                })
            })

            const onSelect = (template) => (
                dispatch(assignments.api.createFromTemplateAndShow(assignment._id,
                    template.template_name))
            )

            const onCancel = () => (
                dispatch(assignments.api.unlock(lockedAssignment))
            )

            return dispatch(showModal({
                modalType: MODALS.SELECT_ITEM_MODAL,
                modalProps: {
                    title: 'Select template',
                    items: items,
                    onSelect: onSelect,
                    onCancel: onCancel,
                },
            }))
        }, (error)  => {
            notify.error(
                getErrorMessage(error, 'Failed to lock assignment.')
            )
            return Promise.reject(error)
        })
    )
)

const _openActionModal = (assignment,
    action,
    lockAction=null) => (
    (dispatch, getState, { notify }) => (
        dispatch(assignments.api.lock(assignment, lockAction))
        .then((lockedAssignment) => (
                dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        assignment: lockedAssignment,
                        actionType: action,
                    },
                }))
            ), (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to obtain the lock on Assignment')
                )

                return Promise.reject(error)
            }
        )
    )
)

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
    onAuthoringMenuClick,
    canLinkItem,
    _openActionModal,
    openSelectTemplateModal,
    onAssignmentFormSave,
    addToAssignmentListGroup,
}

export default self
