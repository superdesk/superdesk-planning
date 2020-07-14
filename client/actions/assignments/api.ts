import moment from 'moment-timezone';
import {get, cloneDeep, has, pick} from 'lodash';

import {appConfig} from 'appConfig';
import {IAssignmentItem} from '../../interfaces';

import * as selectors from '../../selectors';
import * as actions from '../';
import {ASSIGNMENTS, ALL_DESKS, SORT_DIRECTION} from '../../constants';
import planningUtils from '../../utils/planning';
import {lockUtils, getErrorMessage, isExistingItem, gettext} from '../../utils';
import planning from '../planning';
import {assignmentsViewRequiresArchiveItems} from '../../components/Assignments/AssignmentItem/fields';

const setBaseQuery = ({must = []}) => ({
    type: ASSIGNMENTS.ACTIONS.SET_BASE_QUERY,
    payload: {must},
});

const constructQuery = ({
    systemTimezone,
    baseQuery,
    searchQuery,
    deskId = null,
    userId = null,
    states = [],
    type = null,
    priority = null,
    dateFilter = null,
    ignoreScheduledUpdates = false,
}) => {
    let must = [];
    let mustNot = [];

    const filters = [{
        condition: () => deskId && deskId !== ALL_DESKS,
        do: () => {
            must.push(
                {term: {'assigned_to.desk': deskId}}
            );
        },
    }, {
        condition: () => userId,
        do: () => {
            must.push(
                {term: {'assigned_to.user': userId}}
            );
        },
    }, {
        condition: () => get(states, 'length', 0) > 0,
        do: () => {
            must.push(
                {terms: {'assigned_to.state': states}}
            );
        },
    }, {
        condition: () => type,
        do: () => {
            must.push(
                {term: {'planning.g2_content_type': type}}
            );
        },
    }, {
        condition: () => priority,
        do: () => {
            must.push(
                {term: {priority: priority}}
            );
        },
    }, {
        condition: () => searchQuery,
        do: () => {
            must.push(
                {query_string: {query: searchQuery}}
            );
        },
    }, {
        condition: () => dateFilter,
        do: () => {
            const timezoneOffset = moment()
                .tz(systemTimezone || moment.tz.guess())
                .format('Z');

            switch (dateFilter) {
            case 'today':
                must.push({
                    range: {
                        'planning.scheduled': {
                            gte: 'now/d',
                            lte: 'now/d',
                            time_zone: timezoneOffset,
                        },
                    },
                });
                break;
            case 'current':
                must.push({
                    range: {
                        'planning.scheduled': {
                            lte: 'now/d',
                            time_zone: timezoneOffset,
                        },
                    },
                });
                break;
            case 'future':
                must.push({
                    range: {
                        'planning.scheduled': {
                            gt: 'now/d',
                            time_zone: timezoneOffset,
                        },
                    },
                });
                break;
            }
        },
    }, {
        condition: () => ignoreScheduledUpdates,
        do: () => {
            mustNot.push({
                constant_score: {filter: {exists: {field: 'scheduled_update_id'}}},
            });
        },
    }, {
        condition: () => get(baseQuery, 'must.length', 0) > 0,
        do: () => {
            must = must.concat(baseQuery.must);
        },
    }];

    filters.forEach((filter) => {
        if (filter.condition()) {
            filter.do();
        }
    });

    let returnQuery: any = {bool: {must}};

    if (mustNot.length > 0) {
        returnQuery.bool.must_not = mustNot;
    }

    return returnQuery;
};


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
    dateFilter = null,
    size = null,
    ignoreScheduledUpdates = false,
}) => (
    (dispatch, getState, {api}) => {
        const filterByValues = {
            Created: '_created',
            Updated: '_updated',
            Priority: 'priority',
            Scheduled: 'planning.scheduled',
        };

        let sort = '[("' + (get(filterByValues, orderByField, 'planning.scheduled')) + '", '
            + (orderDirection === SORT_DIRECTION.ASCENDING ? 1 : -1) + ')]';

        const baseQuery = selectors.getBaseAssignmentQuery(getState());
        const query = constructQuery({
            systemTimezone: appConfig.defaultTimezone,
            baseQuery: baseQuery,
            searchQuery: searchQuery,
            deskId: deskId,
            userId: userId,
            states: states,
            type: type,
            priority: priority,
            dateFilter: dateFilter,
            ignoreScheduledUpdates: ignoreScheduledUpdates,
        });

        return api('assignments').query({
            page: page,
            sort: sort,
            source: JSON.stringify(size !== null ?
                {query, size} :
                {query}
            ),
        })
            .then((data) => {
                if (get(data, '_items')) {
                    data._items.forEach(planningUtils.modifyCoverageForClient);
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
                planningUtils.modifyCoverageForClient(item);
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
 * Also loads all the associated contacts (if any)
 * @param {Array} assignments - An array of Assignment items
 * @return object
 */
const receivedAssignments = (assignments) => (
    (dispatch) => {
        dispatch(actions.contacts.fetchContactsFromAssignments(assignments));
        if (assignmentsViewRequiresArchiveItems()) {
            dispatch(actions.assignments.api.loadArchiveItems(assignments));
        }
        dispatch({
            type: ASSIGNMENTS.ACTIONS.RECEIVED_ASSIGNMENTS,
            payload: assignments,
        });
    }
);

/**
 * Action to save assignment
 * @param {Object} original - original assignment
 * @param {Object} assignmentUpdates - update values for the assignment
 * @return object
 */
const save = (original, assignmentUpdates) => (
    (dispatch, getState, {api}) => {
        let promise;

        if (original) {
            promise = Promise.resolve(original);
        } else if (!isExistingItem(original)) {
            promise = Promise.resolve({});
        } else {
            promise = dispatch(
                self.fetchAssignmentById(original._id)
            );
        }

        return promise.then((originalItem) => {
            let updates;

            if (original.lock_action === 'reassign') {
                updates = pick(assignmentUpdates, 'assigned_to');
                updates.assigned_to = pick(
                    assignmentUpdates.assigned_to,
                    ['desk', 'user', 'coverage_provider', 'contact']
                );
            } else {
                // Edit priority
                updates = pick(assignmentUpdates, 'priority');
            }

            return api('assignments').save(cloneDeep(originalItem), updates)
                .then(
                    (updated) => {
                        planningUtils.modifyCoverageForClient(updated);
                        dispatch(self.receivedAssignments([updated]));

                        return Promise.resolve(updated);
                    },
                    (error) => Promise.reject(error)
                );
        }, (error) => (Promise.reject(error)));
    }
);

/**
 * Action to link assignment with news item
 * @param {Object} assignment - Assignment
 * @param {Object} newsItem - news item
 * @return Promise
 */
const link = (assignment, newsItem, reassign) => (
    (dispatch, getState, {api}) => (

        api('assignments_link').save({}, {
            assignment_id: assignment._id || assignment.assignment_id,
            item_id: newsItem._id,
            reassign: reassign,
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
    (dispatch, getState, {api, authoringWorkspace, notify}) => (
        api('assignments_content').save({}, {
            assignment_id: assignmentId,
            template_name: templateName,
        })
            .then((item) => authoringWorkspace.edit(item),
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
 * @param {IAssignmentItem} assignment - Assignment to be unlocked
 * @param {String} action - The action to assign to the lock
 * @return Promise
 */
const lock = (assignment: IAssignmentItem, action: string = 'edit') => (
    (dispatch, getState, {api, notify}) => {
        if (lockUtils.isItemLockedInThisSession(
            assignment,
            selectors.general.session(getState()),
            selectors.locks.getLockedItems(getState())
        )) {
            return Promise.resolve(assignment);
        }

        return api('assignments_lock', assignment).save({}, {lock_action: action})
            .then(
                (lockedItem: IAssignmentItem) => lockedItem,
                (error) => {
                    const msg = get(error, 'data._message') || 'Could not lock the assignment.';

                    notify.error(msg);
                    if (error) throw error;
                });
    }
);

/**
 * Action to unlock an assignment
 * @param {IAssignmentItem} assignment - Assignment to be unlocked
 * @return Promise
 */
const unlock = (assignment: IAssignmentItem) => (
    (dispatch, getState, {api, notify}) => (
        api('assignments_unlock', assignment).save({})
            .then(
                (unlockedItem: IAssignmentItem) => unlockedItem,
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
    (dispatch, getState, {api}) => {
        if (selectors.getCurrentAssignmentId(getState()) !== get(assignment, '_id')) {
            return Promise.resolve();
        }

        // Query the API and sort by created
        return api('assignments_history').query({
            where: {assignment_id: assignment._id},
            max_results: 200,
            sort: '[(\'_created\', 1)]',
        })
            .then((data) => {
                dispatch(self.receiveAssignmentHistory(data._items));
                return Promise.resolve(data);
            }, (error) => (Promise.reject(error)));
    }
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
const loadPlanningAndEvent = (assignment) => (dispatch) =>
    dispatch(planning.api.fetchById(assignment.planning_item));

/**
 * Loads the Archive items that are linked to the provided Assignment list
 * The Archive items is then saved to the redux store under
 * assignment.archive dictionary
 */
const loadArchiveItems = (assignments: Array<any>) => (
    dispatch,
    getState,
    {api, notify, search}
) => {
    const assignmentIds = assignments.map((a) => a._id);

    const query = search.query();
    const filter = {
        bool: {
            must: {
                terms: {
                    assignment_id: assignmentIds
                }
            }
        },
    };

    query.filter(filter);

    const criteria = query.getCriteria(true);

    criteria.repo = 'archive,archived,published';

    return api.query('search', criteria)
        .then((data) => {
            const items = data._items;

            if (!items) {
                const msg = gettext('Content items not found!');

                notify.error(msg);
                return Promise.reject(msg);
            }

            dispatch({
                type: ASSIGNMENTS.ACTIONS.RECEIVED_ARCHIVE,
                payload: items,
            });
        }, (error) => {
            notify.error(error, 'Failed to load content items');

            return Promise.reject(error);
        });
};
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

const unlink = (assignment) => (
    (dispatch, getState, {api, notify}) => (
        api('assignments_unlink').save({}, {
            assignment_id: assignment._id,
            item_id: get(assignment, 'item_ids[0]'),
        })
            .then(() => {
                notify.success(gettext('Assignment reverted.'));
                return dispatch(self.unlock(assignment));
            }, (error) => {
                notify.error(get(error, 'data._message') || gettext('Could not unlock the assignment.'));
                throw error;
            })
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
    loadArchiveItems,
    loadArchiveItem,
    removeAssignment,
    fetchAssignmentHistory,
    receiveAssignmentHistory,
    unlink,
    setBaseQuery,
    constructQuery,
};

export default self;
