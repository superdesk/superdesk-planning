import assignments from './index'
import * as selectors from '../../selectors'
import { ASSIGNMENTS, PRIVILEGES } from '../../constants'
import { checkPermission } from '../../utils'

/**
 * Action dispatcher to load the list of assignments for current list settings.
 * @param {string} filterBy - the filter by desk or user ('All', 'User')
 * @param {string} searchQuery - the text used for free text query
 * @param {string} orderByField - the field used to order the assignments ('Created', 'Updated')
 * @param {string} orderDirection - the direction of order ('Asc', 'Desc')
 */
const loadAssignments = (filterBy, searchQuery, orderByField, orderDirection) =>
    (dispatch) => {
        dispatch(
            self.changeListSettings(filterBy, searchQuery, orderByField, orderDirection)
        )

        return dispatch(assignments.api.query())
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
    (dispatch) => {
        dispatch(self.changeLastAssignmentLoadedPage(
            { lastAssignmentLoadedPage: 1 }
        ))

        return dispatch(assignments.api.query())
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
        const state = getState()
        const { lastAssignmentLoadedPage } = selectors.getAssignmentListSettings(state)

        dispatch(changeLastAssignmentLoadedPage(
            { lastAssignmentLoadedPage: lastAssignmentLoadedPage + 1 }
        ))

        return dispatch(assignments.api.query())
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
    (dispatch) => (
        dispatch(assignments.api.query())
        .then((data) => {
            dispatch(assignments.api.receivedAssignments(data._items))
            dispatch(self.setInList(data._items.map((a) => a._id)))
            return Promise.resolve(data._items)
        })
    )

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
 * @return object
 */
const changeListSettings = (filterBy, searchQuery, orderByField, orderDirection) => ({
    type: ASSIGNMENTS.ACTIONS.CHANGE_LIST_SETTINGS,
    payload: {
        filterBy,
        searchQuery,
        orderByField,
        orderDirection,
    },
})

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
    _openEditor,
    PRIVILEGES.PLANNING_MANAGEMENT,
    'Unauthorised to edit a Assignment item!',
    preview
)

const save = (item) => (
    (dispatch, getState, { notify }) => (
        dispatch(assignments.api.save(item))
        .then((item) => {
            notify.success('The assignment has been saved.')
            return Promise.resolve(item)
        }, (error) => {
            notify.error('Failed to save the assignment.')
            return Promise.reject(error)
        })
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
    save,
}

export default self
