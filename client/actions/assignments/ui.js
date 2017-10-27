import assignments from './index'
import * as selectors from '../../selectors'
import { ASSIGNMENTS, PRIVILEGES } from '../../constants'
import { checkPermission, getErrorMessage, isItemLockedInThisSession } from '../../utils'

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
) => (dispatch, getState) => {
        dispatch(
            self.changeListSettings(filterBy, searchQuery,
                orderByField, orderDirection, filterByState, filterByType)
        )

        return dispatch(assignments.api.query(selectors.getAssignmentSearch(getState())))
        .then((data) => {
            dispatch(assignments.api.receivedAssignments(data._items))
            dispatch(self.setInList(data._items.map((a) => a._id)))
            return Promise.resolve(data._items)
        })
    }

/**
 * Action dispatcher to load first page of the list of assignments for current list settings.
 */
const reloadAssignments = () =>
    (dispatch, getState) => {
        dispatch(self.changeLastAssignmentLoadedPage(
            { lastAssignmentLoadedPage: 1 }
        ))

        return dispatch(assignments.api.query(selectors.getAssignmentSearch(getState())))
        .then((data) => {
            dispatch(assignments.api.receivedAssignments(data._items))
            dispatch(self.setInList(data._items.map((a) => a._id)))
            return Promise.resolve(data._items)
        })
    }

/**
 * Action dispatcher to load the next page of assignments.
 */
const loadMoreAssignments = () =>
    (dispatch, getState) => {
        const page = selectors.getAssignmentPage(getState())
        const previousSearch = selectors.getAssignmentSearch(getState())
        const search = {
            ...previousSearch,
            page: page + 1 || 1,
        }

        dispatch(changeLastAssignmentLoadedPage({ lastAssignmentLoadedPage: search.page }))

        return dispatch(assignments.api.query(search))
        .then((data) => {
            dispatch(assignments.api.receivedAssignments(data._items))
            dispatch(self.addToList(data._items.map((a) => a._id)))
            return Promise.resolve(data._items)
        })
    }

/**
 * Action dispatcher to load the assignments.
 */
const fetch = () =>
    (dispatch, getState) => (
        dispatch(assignments.api.query(selectors.getAssignmentSearch(getState())))
        .then((data) => {
            dispatch(assignments.api.receivedAssignments(data._items))
            dispatch(self.setInList(data._items.map((a) => a._id)))
            return Promise.resolve(data._items)
        }))

/**
 * Action to change the last loaded page for the list of Assignments
 * @param {number} lastAssignmentLoadedPage - the last loaded page
 * @return object
 */
const changeLastAssignmentLoadedPage = (lastAssignmentLoadedPage) => ({
    type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
    payload: { lastAssignmentLoadedPage },
})

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
                            orderDirection, filterByState=null, filterByType=null) => ({
    type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
    payload: {
        filterBy,
        searchQuery,
        orderByField,
        orderDirection,
        filterByState,
        filterByType,
    },
})

/**
 * Open assignment in preview mode
 * @param {object} assignment - The Assignment to preview
 * @return object
 */
const preview = (assignment) => (
    (dispatch, getState) => {
        if (isItemLockedInThisSession(assignment, selectors.getSessionDetails(getState()))) {
            dispatch(_openEditor(assignment))
        } else {
            dispatch({
                type: ASSIGNMENTS.ACTIONS.PREVIEW_ASSIGNMENT,
                payload: assignment,
            })
        }
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
 * Action that sets the list of visible assignments items
 * @param {Array} ids - An array of assignments item ids
 */
const setInList = (ids) => ({
    type: ASSIGNMENTS.ACTIONS.SET_ASSIGNMENTS_LIST,
    payload: ids,
})

/**
 * Action that adds assignments items to the list of visible assignments items
 * @param {Array} ids - An array of assignments item ids
 */
const addToList = (ids) => ({
    type: ASSIGNMENTS.ACTIONS.ADD_TO_ASSIGNMENTS_LIST,
    payload: ids,
})

/**
 * Action to lock an assignment and open it in the editor
 * @param {object} - Assignment to open
 */
const _lockAndOpenEditor = (assignment) => (
    (dispatch) => (
        dispatch(assignments.api.lock(assignment))
            .then((lockedItem) => {
                dispatch(_openEditor(lockedItem))
                return Promise.resolve(lockedItem)
            }, () => (Promise.resolve(assignment))
        )
    )
)

/**
 * Action to unlock an assignment and close the editor
 * @param {object} - Assignment to close
 */
const closeEditor = (assignment) => (
    (dispatch, getState) => {
        if (isItemLockedInThisSession(assignment, selectors.getSessionDetails(getState())) &&
            assignment.lock_action === 'edit') {
            return dispatch(assignments.api.unlock(assignment))
                .then((item) => {
                    dispatch(closePreview())
                    return Promise.resolve(item)
                }, () => {
                    dispatch(closePreview())
                    return Promise.resolve(assignment)
                }
            )
        } else {
            dispatch(closePreview())
            return Promise.resolve(assignment)
        }
    }
)

/**
 * Action for opening the assignment editor
 */
const _openEditor = (item) => ({
    type: ASSIGNMENTS.ACTIONS.OPEN_ASSIGNMENT_EDITOR,
    payload: item,
})

/**
 * Action for closing the assignment editor
 *
 */
const openEditor = checkPermission(
    _lockAndOpenEditor,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to edit a Assignment item!',
    preview
)

/**
 * Action for saving the assignment
 * @param {Object} item - Assignment to Save
 */
const save = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(assignments.api.save(item))
        .then((item) => {
            notify.success('The assignment has been saved.')
            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to save the assignment.')
            )
            return Promise.reject(error)
        })
    )
)

/**
 * Action for fulfil the assignment
 * @param {Object} assignment - Assignment to link
 * @param {Object} newsItem - Newsitem to link
 */
const onFulFilAssignment = (assignment, newsItem) => (
    (dispatch, getState, { notify }) => (
        dispatch(assignments.api.link(assignment, newsItem))
        .then((item) => {
            notify.success('Assignment is fulfilled.')
            return Promise.resolve(item)
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to fulfil assignment.')
            )
            return Promise.reject(error)
        })
    )
)

const complete = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(assignments.api.complete(item))
        .then((item) => {
            notify.success('The assignment has been completed.')
            dispatch(self.closePreview())
            return Promise.resolve(item)
        }, (error) => {
            notify.error('Failed to complete the assignment.')
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

const self = {
    loadAssignments,
    changeListSettings,
    reloadAssignments,
    loadMoreAssignments,
    preview,
    closePreview,
    toggleAssignmentSelection,
    setInList,
    addToList,
    changeLastAssignmentLoadedPage,
    fetch,
    _openEditor,
    openEditor,
    closeEditor,
    save,
    onFulFilAssignment,
    complete,
    onAuthoringMenuClick,
    canLinkItem,
}

export default self
