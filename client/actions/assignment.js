import * as selectors from '../selectors'

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
            changeListSettings(filterBy, searchQuery, orderByField, orderDirection)
        )

        return dispatch(query())
        .then((data) =>
            dispatch(receivedAssignments(data._items))
        )
    }

/**
 * Action dispatcher to load the next page of assignments.
 * @param getState
 */
const loadMoreAssignments = () =>
    (dispatch, getState) => {
        const state = getState()
        const { lastAssignmentLoadedPage } = selectors.getAssignmentListSettings(state)

        dispatch(changeLastAssignmentLoadedPage(
            { lastAssignmentLoadedPage: lastAssignmentLoadedPage + 1 }
        ))

        dispatch(query())
        .then((data) =>
            dispatch(receivedMoreAssignments(data._items))
        )
    }

/**
 * Action Dispatcher for query the api for events
 * @return arrow function
 */
const query = () =>
    (dispatch, getState, { api, desks }) => {
        const {
            filterBy,
            searchQuery,
            orderByField,
            orderDirection,
            lastAssignmentLoadedPage,
        } =  selectors.getAssignmentListSettings(getState())
        const filterByValues = {
            Created: '_created',
            Updated: '_updated',
        }
        let query = {}
        let must = []
        let sort = '[("' + filterByValues[orderByField] + '", '
            + (orderDirection === 'Asc' ? 1 : -1) + ')]'

        if (filterBy === 'All') {
            const deskId = desks.getCurrentDeskId()

            must.push(
                { term: { 'planning.assigned_to.desk': deskId } }
            )
        }

        if (filterBy === 'User') {
            const userId = selectors.getCurrentUserId(getState())

            must.push(
                { term: { 'planning.assigned_to.user': userId } }
            )
        }

        if (searchQuery) {
            must.push({ query_string: { query: searchQuery } })
        }

        query.bool = { must }

        return api('coverage').query({
            page: lastAssignmentLoadedPage,
            sort: sort,
            source: JSON.stringify({ query }),
        })
        .then((data) => ({ ...data }))
    }

/**
 * Action to change the filter&search for the list of Assignments
 * @param {string} filterBy - the filter by desk or user ('All', 'User')
 * @param {string} searchQuery - the text used for free text query
 * @param {string} orderByField - the field used to order the assignments ('Created', 'Updated')
 * @param {string} orderDirection - the direction of order ('Asc', 'Desc')
 * @return object
 */
const changeListSettings = (filterBy, searchQuery, orderByField, orderDirection) => ({
    type: 'CHANGE_LIST_SETTINGS',
    payload: {
        filterBy,
        searchQuery,
        orderByField,
        orderDirection,
    },
})

/**
 * Action to change the last loaded page for the list of Assignments
 * @param {number} lastAssignmentLoadedPage - the last loaded page
 * @return object
 */
const changeLastAssignmentLoadedPage = (lastAssignmentLoadedPage) => ({
    type: 'CHANGE_LIST_SETTINGS',
    payload: { lastAssignmentLoadedPage },
})

/**
 * Action to receive the list of Assignments and store them in the store
 * @param {Array} assignments - An array of Assignment items
 * @return object
 */
const receivedAssignments = (assignments) => ({
    type: 'RECEIVED_ASSIGNMENTS',
    payload: assignments,
})

/**
 * Action to receive the list of Assignments and store them in the store
 * @param {Array} assignments - An array of Assignment items
 * @return object
 */
const receivedMoreAssignments = (assignments) => ({
    type: 'RECEIVED_MORE_ASSIGNMENTS',
    payload: assignments,
})

/**
 * Action dispatcher to create a new assignment.
 * @param user
 * @param state
 */
const createAssignment = () => (
    () =>
        // functionality not implemented yet
        Promise.resolve()
)

/**
 * Opens assignment in preview mode
 * @param {object} assignment - The Assignment to preview
 * @return Promise
 */
const previewAssignment = () => (
    () =>
        // functionality not implemented yet
        Promise.resolve()
)

/**
 * Opens assignment in edit mode
 * @param {object} assignment - The Assignment to edit
 * @return Promise
 */
const openAssignmentDetails = () => (
    () =>
        // functionality not implemented yet
        Promise.resolve()
)

/**
 * Toggle the current selection of on assignment
 * @param {object} assignemnt - The Assignment to toggle
 * @param {object} value - The toggle value
 */
const toggleAssignmentSelection = ({ assignment, value }) => (
    {
        type: value ? 'SELECT_ASSIGNMENTS' : 'DESELECT_ASSIGNMENT',
        payload: value ? [assignment] : assignment,
    }
)

export {
    changeListSettings,
    loadAssignments,
    loadMoreAssignments,
    query,
    createAssignment,
    previewAssignment,
    openAssignmentDetails,
    toggleAssignmentSelection,
}
