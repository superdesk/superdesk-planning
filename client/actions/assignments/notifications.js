import * as selectors from '../../selectors';
import assignments from './index';
import main from '../main';
import {get, isEmpty} from 'lodash';
import planning from '../planning';
import {ASSIGNMENTS, WORKSPACE, PLANNING} from '../../constants';
import {lockUtils, assignmentUtils, gettext, isExistingItem} from '../../utils';
import {hideModal, showModal} from '../index';

/**
 * WS Action when a new Assignment item is created
 * @param {object} _e - Event object
 * @param {object} data - Assignment, User, Desk IDs
 */
const onAssignmentCreated = (_e, data) => (
    (dispatch, getState) => {
        const currentDesk = selectors.general.currentDeskId(getState());

        let querySearchSettings = selectors.getAssignmentSearch(getState());

        // Updates my assignment count
        dispatch(
            assignments.ui.queryAndGetMyAssignments(
                [
                    ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
                    ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED,
                ]
            )
        );

        if (querySearchSettings.deskId === null || currentDesk &&
            (currentDesk === data.assigned_desk || currentDesk === data.original_assigned_desk)) {
            dispatch(assignments.ui.reloadAssignments([data.assignment_state]));
        }

        return Promise.resolve();
    }
);


/**
 * WS Action when a Assignment item is updated
 * @param {object} _e - Event object
 * @param {object} data - Assignment, User, Desk IDs
 */
const onAssignmentUpdated = (_e, data) => (
    (dispatch, getState) => {
        const currentDesk = selectors.general.currentDeskId(getState());
        let querySearchSettings = selectors.getAssignmentSearch(getState());

        dispatch(_updatePlannigRelatedToAssignment(data));

        if (!currentDesk) {
            return;
        }

        // Updates my assignments count
        dispatch(
            assignments.ui.queryAndGetMyAssignments(
                [
                    ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
                    ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED,
                ]
            )
        );

        if (querySearchSettings.deskId === null ||
                currentDesk === data.assigned_desk || currentDesk === data.original_assigned_desk) {
            dispatch(assignments.api.fetchAssignmentHistory({_id: data.item}));
            dispatch(assignments.ui.reloadAssignments([data.assignment_state]));

            dispatch(assignments.api.fetchAssignmentById(data.item))
                .then((assignmentInStore) => {
                // If assignment moved from one state to another, check if group changed
                // And trigger reload
                    if (assignmentInStore.assigned_to.state !== data.assignment_state) {
                        const originalGroup = assignmentUtils.getAssignmentGroupByStates(
                            [assignmentInStore.assigned_to.state]);
                        const newGroup = assignmentUtils.getAssignmentGroupByStates(
                            [data.assignment_state]);

                        if (newGroup.label !== originalGroup.label) {
                            dispatch(assignments.ui.reloadAssignments(
                                [assignmentInStore.assigned_to.state]));
                        }
                    }
                });

            if (data.assignment_state === ASSIGNMENTS.WORKFLOW_STATE.CANCELLED ||
                 data.assignment_state === ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS) {
                // If we are in authoring workspace (fulfilment) and assignment is previewed,
                // close it
                if (selectors.general.currentWorkspace(getState()) === WORKSPACE.AUTHORING &&
                        selectors.getCurrentAssignmentId(getState()) === data.item) {
                    dispatch(assignments.ui.closePreview());
                }
            }
        }

        if (!get(data, 'lock_user')) {
            // Assignment was completed on editor but context was a different desk
            return dispatch(assignments.api.fetchAssignmentById(data.item, false))
                .then((assignmentInStore) => {
                    const locks = selectors.locks.getLockedItems(getState());
                    const itemLock = lockUtils.getLock(assignmentInStore, locks);

                    if (itemLock) {
                        let item = {
                            ...assignmentInStore,
                            lock_action: null,
                            lock_user: null,
                            lock_session: null,
                            lock_time: null,
                        };

                        dispatch({
                            type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
                            payload: {assignment: item},
                        });
                    }
                });
        }
    }
);

const _updatePlannigRelatedToAssignment = (data) => (
    (dispatch, getState) => {
        const plans = selectors.planning.storedPlannings(getState());
        const session = selectors.general.session(getState());

        if (!get(data, 'planning')) {
            return Promise.resolve();
        }

        let planningItem = {...get(plans, data.planning)};

        if (!isExistingItem(planningItem)) {
            return Promise.resolve();
        }

        let coverages = get(planningItem, 'coverages') || [];
        let coverage = coverages.find((cov) => cov.coverage_id === data.coverage);

        if (!coverage || isEmpty(coverage.assigned_to)) {
            return Promise.resolve();
        }

        if (get(planningItem, 'lock_action') !== 'edit' && !!get(planningItem, 'lock_user') &&
                !lockUtils.isItemLockedInThisSession(planningItem, session)) {
            dispatch({
                type: PLANNING.ACTIONS.UNLOCK_PLANNING,
                payload: {plan: planningItem},
            });
        }

        coverage.assigned_to.user = data.assigned_user;
        coverage.assigned_to.desk = data.assigned_desk;
        coverage.assigned_to.state = data.assignment_state;

        if (get(data, 'priority')) {
            coverage.assigned_to.priority = data.priority;
        }

        dispatch(planning.api.receivePlannings([planningItem]));
        dispatch(main.fetchItemHistory(planningItem));
    }
);

const onAssignmentLocked = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            return dispatch(assignments.api.fetchAssignmentById(data.item, false))
                .then((assignmentInStore) => {
                    let item = {
                        ...assignmentInStore,
                        lock_action: data.lock_action,
                        lock_user: data.user,
                        lock_session: data.lock_session,
                        lock_time: data.lock_time,
                        _etag: data.etag,
                    };

                    dispatch({
                        type: ASSIGNMENTS.ACTIONS.LOCK_ASSIGNMENT,
                        payload: {assignment: item},
                    });

                    return Promise.resolve(item);
                });
        }

        return Promise.resolve();
    }
);

/**
 * WS Action when a Planning item gets unlocked
 * If the Planning Item is unlocked don't fetch it. Just update the store directly by a dispatch.
 * This is done because backend Eve caching is returning old objects on subsequent fetch if locking
 * is applied.
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onAssignmentUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            return dispatch(assignments.api.fetchAssignmentById(data.item, false))
                .then((assignmentInStore) => {
                    const locks = selectors.locks.getLockedItems(getState());
                    const itemLock = lockUtils.getLock(assignmentInStore, locks);
                    const sessionId = selectors.general.session(getState()).sessionId;

                    let assignment = {
                        ...assignmentInStore,
                        _id: data.item,
                        lock_action: null,
                        lock_user: null,
                        lock_session: null,
                        lock_time: null,
                        _etag: data.etag,
                    };

                    dispatch({
                        type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
                        payload: {assignment: assignment},
                    });

                    // If this is the planning item currently being edited, show popup notification
                    if (itemLock !== null &&
                    data.lock_session !== sessionId &&
                    itemLock.session === sessionId
                    ) {
                        const user = selectors.general.users(getState()).find((u) => u._id === data.user);

                        dispatch(hideModal());
                        dispatch(showModal({
                            modalType: 'NOTIFICATION_MODAL',
                            modalProps: {
                                title: 'Item Unlocked',
                                body: 'The assignment item you were editing was unlocked by "' +
                                user.display_name + '"',
                            },
                        }));
                    }

                    return Promise.resolve();
                });
        }
    }
);

/**
 * WS Action when an Assignment is deleted
 * @param {object} _e - Event object
 * @param {object} data - IDs for the Assignment, Planning and Coverage items
 */
const onAssignmentRemoved = (_e, data) => (
    (dispatch, getState, {notify}) => {
        if (get(data, 'assignment')) {
            const currentAssignmentId = selectors.getCurrentAssignmentId(getState());
            const currentSessionId = selectors.general.sessionId(getState());

            if (data.assignment === currentAssignmentId && data.session !== currentSessionId) {
                notify.warning(gettext('The Assignment you were viewing was removed.'));
            }

            dispatch({
                type: ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT,
                payload: data,
            });

            // Updates my assignment count
            dispatch(
                assignments.ui.queryAndGetMyAssignments(
                    [
                        ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
                        ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED,
                    ]
                )
            );

            return dispatch(_updatePlannigRelatedToAssignment(data));
        }

        return Promise.resolve();
    }
);

const onAssignmentRemoveFailed = (_e, data) => (
    (dispatch, getState, {notify}) => {
        const currentUserId = selectors.general.currentUserId(getState());
        const sessionId = selectors.general.sessionId(getState());

        if (get(data, 'items.length', 0) > 0 &&
                get(data, 'user') === currentUserId &&
                get(data, 'session') === sessionId) {
            const msg = data.items.map((i) => gettext('Delete of {{ type }} assignment \'{{ slugline }}\' failed',
                {
                    type: get(i, 'type'),
                    slugline: get(i, 'slugline'),
                })).join('\n');

            notify.error(msg);
        }

        return Promise.resolve();
    }
);

// eslint-disable-next-line consistent-this
const self = {
    onAssignmentCreated,
    onAssignmentUpdated,
    onAssignmentLocked,
    onAssignmentUnlocked,
    onAssignmentRemoved,
    onAssignmentRemoveFailed,
};

// Map of notification name and Action Event to execute
self.events = {
    'assignments:created': () => (self.onAssignmentCreated),
    'assignments:lock': () => (self.onAssignmentLocked),
    'assignments:unlock': () => (self.onAssignmentUnlocked),
    'assignments:updated': () => (self.onAssignmentUpdated),
    'assignments:completed': () => (self.onAssignmentUpdated),
    'assignments:reverted': () => (self.onAssignmentUpdated),
    'assignments:removed': () => (self.onAssignmentRemoved),
    'assignments:remove:fail': () => (self.onAssignmentRemoveFailed),
};

export default self;
