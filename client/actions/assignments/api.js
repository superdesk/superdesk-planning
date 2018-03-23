import * as selectors from '../../selectors';
import {ASSIGNMENTS} from '../../constants';
import planningUtils from '../../utils/planning';
import {get, cloneDeep, has, pick} from 'lodash';
import {lockUtils, getErrorMessage} from '../../utils';
import planning from '../planning';

/**
 * Action Dispatcher for query the api for events
 * @return arrow function
 */
const query = ({
    searchQuery,
    orderByField,
    orderDirection,
    page = 1,
    deskId = null,
    userId = null,
    states = [],
    type = null,
    priority = null,
}) => (
    (dispatch, getState, {api}) => {
        const filterByValues = {
            Created: '_created',
            Updated: '_updated',
            Priority: 'priority',
        };

        let query = {};
        let must = [];
        let sort = '[("' + (get(filterByValues, orderByField, '_updated')) + '", '
            + (orderDirection === 'Asc' ? 1 : -1) + ')]';

        if (deskId) {
            must.push(
                {term: {'assigned_to.desk': deskId}}
            );
        }

        if (userId) {
            must.push(
                {term: {'assigned_to.user': userId}}
            );
        }

        if (states.length > 0) {
            must.push(
                {terms: {'assigned_to.state': states}}
            );
        }

        if (type) {
            must.push(
                {term: {'planning.g2_content_type': type}}
            );
        }

        if (priority) {
            must.push(
                {term: {priority: priority}}
            );
        }

        if (searchQuery) {
            must.push({query_string: {query: searchQuery}});
        }

        query.bool = {must};

        return api('assignments').query({
            page: page,
            sort: sort,
            source: JSON.stringify({query}),
        })
            .then((data) => {
                if (get(data, '_items')) {
                    data._items.forEach(planningUtils.convertGenreToObject);
                    return Promise.resolve(data);
                } else {
                    return Promise.reject('Failed to retrieve items');
                }
            }, (error) => (Promise.reject(error)));
    }
);

/**
 * Action Dispatcher that fetches a Assignment Item by ID
 * and adds or updates it in the redux store.
 * If the Assignment item already exists in the local store, then don't
 * fetch the Assignment item from the API
 * @param {string} id - The ID of the Assignment item to fetch
 * @param {boolean} force - Force using the API instead of local store
 * @return Promise
 */
const fetchAssignmentById = (id, force = false, recieve = true) => (
    (dispatch, getState, {api}) => {
        // Test if the Assignment item is already loaded into the store
        // If so, return that instance instead
        const storedAssignments = selectors.getStoredAssignments(getState());

        if (has(storedAssignments, id) && !force) {
            return Promise.resolve(storedAssignments[id]);
        }

        return api('assignments').getById(id)
            .then((item) => {
                if (recieve) {
                    dispatch(self.receivedAssignments([item]));
                }

                return Promise.resolve(item);
            }, (error) => Promise.reject(error));
    }
);

/**
 * Action dispatcher to query the API for all Assignments that are currently locked
 * @return Array of locked Assignments
 */
const queryLockedAssignments = () => (
    (dispatch, getState, {api}) => (
        api('assignments').query({
            source: JSON.stringify(
                {query: {constant_score: {filter: {exists: {field: 'lock_session'}}}}}
            ),
        })
            .then(
                (data) => Promise.resolve(data._items),
                (error) => Promise.reject(error)
            )
    )
);

/**
 * Action to receive the list of Assignments and store them in the store
 * @param {Array} assignments - An array of Assignment items
 * @return object
 */
const receivedAssignments = (assignments) => ({
    type: ASSIGNMENTS.ACTIONS.RECEIVED_ASSIGNMENTS,
    payload: assignments,
});

/**
 * Action to save assignment
 * @param {Object} item - assignment to save
 * @param {Object} original - original assignment
 * @return object
 */
const save = (item, original = undefined) => (
    (dispatch, getState, {api}) => (
        // Find the original (if it exists) either from the store or the API
        new Promise((resolve, reject) => {
            if (original !== undefined) {
                return resolve(original);
            } else if (get(item, '_id')) {
                return dispatch(self.fetchAssignmentById(item._id))
                    .then(
                        (item) => (resolve(item)),
                        (error) => (reject(error))
                    );
            } else {
                return resolve({});
            }
        })
            .then((originalItem) => {
                let updates = {};

                if (item.lock_action === 'reassign') {
                    updates = pick(item, 'assigned_to');
                    updates.assigned_to = pick(item.assigned_to, ['desk', 'user', 'coverage_provider']);
                } else {
                // Edit priority
                    updates = pick(item, 'priority');
                }

                return api('assignments').save(cloneDeep(originalItem), updates)
                    .then((updated) => {
                        planningUtils.convertGenreToObject(updated);
                        dispatch(self.receivedAssignments([updated]));
                        return Promise.resolve(updated);
                    }, (error) => (Promise.reject(error))
                    );
            }, (error) => (Promise.reject(error)))
    )
);

/**
 * Action to link assignment with news item
 * @param {Object} assignment - Assignment
 * @param {Object} newsItem - news item
 * @return Promise
 */
const link = (assignment, newsItem) => (
    (dispatch, getState, {api}) => (

        api('assignments_link').save({}, {
            assignment_id: assignment._id || assignment.assignment_id,
            item_id: newsItem._id,
        })
            .then((item) => {
                newsItem.assignment_id = item.assignment_id;
                return Promise.resolve(item);
            }, (error) => Promise.reject(error))
    )
);

/**
 * Action to create news item from assignment and template
 * @param {String} assignmentId - Id of the Assignment
 * @param {String} templateName - name of the template to use
 * @return Promise
 */
const createFromTemplateAndShow = (assignmentId, templateName) => (
    (dispatch, getState, {api, authoringWorkspace}) => (
        api('assignments_content').save({}, {
            assignment_id: assignmentId,
            template_name: templateName,
        })
            .then((item) => authoringWorkspace.edit(item))
    )
);

/**
 * Action to complete an assignment
 * @param {String} item - Assignment to be completed
 * @return Promise
 */
const complete = (item) => (
    (dispatch, getState, {api}) => (
        api.update(
            'assignments_complete',
            item,
            {}
        )
    )
);

const revert = (item) => (
    (dispatch, getState, {api}) => (
        api.update(
            'assignments_revert',
            item,
            {}
        )
    )
);

/**
 * Action to lock an assignment
 * @param {String} item - Assignment to be unlocked
 * @return Promise
 */
const lock = (assignment, action = 'edit') => (
    (dispatch, getState, {api, notify}) => {
        if (lockUtils.isItemLockedInThisSession(assignment, selectors.getSessionDetails(getState()))) {
            return Promise.resolve(assignment);
        }

        return api('assignments_lock', assignment).save({}, {lock_action: action})
            .then(
                (lockedItem) => (lockedItem),
                (error) => {
                    const msg = get(error, 'data._message') || 'Could not lock the assignment.';

                    notify.error(msg);
                    if (error) throw error;
                });
    }
);

/**
 * Action to unlock an assignment
 * @param {String} item - Assignment to be unlocked
 * @return Promise
 */
const unlock = (assignment) => (
    (dispatch, getState, {api, notify}) => (
        api('assignments_unlock', assignment).save({})
            .then((item) => (item),
                (error) => {
                    const msg = get(error, 'data._message') || 'Could not unlock the assignment.';

                    notify.error(msg);
                    throw error;
                })
    )
);

/**
 * Fetch history of an assignment
 * @param {object} assignment - The Assignment to load history for
 */
const fetchAssignmentHistory = (assignment) => (
    (dispatch, getState, {api}) => (
        // Query the API and sort by created
        api('assignments_history').query({
            where: {assignment_id: assignment._id},
            max_results: 200,
            sort: '[(\'_created\', 1)]',
        })
            .then((data) => {
                dispatch(self.receiveAssignmentHistory(data._items));
                return Promise.resolve(data);
            }, (error) => (Promise.reject(error)))
    )
);

/**
 * Action to receive the history of actions on an assignment
 * @param {array} planningHistoryItems - An array of assignment history items
 * @return object
 */
const receiveAssignmentHistory = (items) => ({
    type: ASSIGNMENTS.ACTIONS.RECEIVE_ASSIGNMENT_HISTORY,
    payload: items,
});

/**
 * Fetch the Event and/or Planning item(s) associated with this Assignment
 * @param {object} assignment - The Assignment to load items for
 */
const loadPlanningAndEvent = (assignment) => (
    (dispatch) => (
        dispatch(planning.api.fetchById(assignment.planning_item))
    )
);

/**
 * Loads the Archive item that is linked to the provided Assignment
 * The Archive item is then saved to the redux store under
 * assignment.archive dictionary
 * @param {object} assignment - The assignment to load the Archive item for
 * @return Promise
 */
const loadArchiveItem = (assignment) => (
    (dispatch, getState, {api, notify, desks, search}) => {
        // If the object provided doesn't have an _id field
        // then bail out now
        const assignmentId = get(assignment, '_id', null);

        if (!assignmentId) {
            notify.error('Incorrect Assignment');
            return Promise.reject('Incorrect Assignment');
        }

        // Use the search service from client-core to load the archive item
        const query = search.query();

        query.filter({
            bool: {
                must: [
                    {term: {assignment_id: assignmentId}},
                ],
            },
        });

        const criteria = query.getCriteria(true);

        // We want the item from either the `archive`, `archived` or `published` collections
        criteria.repo = 'archive,archived,published';

        return api.query('search', criteria)
            .then((data) => {
                const item = get(data, '_items[0]', null);

                if (!item) {
                    notify.error('Content item not found!');
                    return Promise.reject('Content item not found!');
                }

                // Use the `desks` service from client-core to save the desk/stage names
                // in the Archive item (so that we don't have to perform a lookup later)
                item._deskName = desks.deskLookup[get(item, 'task.desk')].name;
                item._stageName = desks.stageLookup[get(item, 'task.stage')].name;

                // Finally save the Archive item in the redux store
                dispatch({
                    type: ASSIGNMENTS.ACTIONS.RECEIVED_ARCHIVE,
                    payload: item,
                });
                return Promise.resolve(item);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to load content item')
                );
                return Promise.reject(error);
            });
    }
);

/**
 * Delete the Assignment, and unlink it from Content and Planning items
 * @param {object} assignment - The Assignment to delete
 * @return Promise - The response to the API call
 */
const removeAssignment = (assignment) => (
    (dispatch, getState, {api}) => (
        api('assignments').remove(assignment)
    )
);

// eslint-disable-next-line consistent-this
const self = {
    query,
    receivedAssignments,
    fetchAssignmentById,
    save,
    link,
    createFromTemplateAndShow,
    complete,
    revert,
    lock,
    unlock,
    queryLockedAssignments,
    loadPlanningAndEvent,
    loadArchiveItem,
    removeAssignment,
    fetchAssignmentHistory,
    receiveAssignmentHistory,
};

export default self;
