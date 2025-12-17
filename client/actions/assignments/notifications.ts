import {get, cloneDeep} from 'lodash';

import {
    IWebsocketMessageData, EDITOR_TYPE, IEventOrPlanningItem, IPlanningItem, IPlanningAppState} from '../../interfaces';

import {planningApi, superdeskApi} from '../../superdeskApi';
import {ASSIGNMENTS, WORKSPACE, MODALS, ITEM_TYPE} from '../../constants';
import {lockUtils, assignmentUtils, gettext, isExistingItem, getAutosaveItem} from '../../utils';

import {editors as editorsActions} from '../../actions';
import * as selectors from '../../selectors';
import assignments from './index';
import main from '../main';
import {hideModal, showModal} from '../index';
import planningApis from '../planning/api';

type GetStateFunc = () => IPlanningAppState;

const _notifyAssignmentEdited = (assignmentId) => (
    (dispatch, getState, {notify}) => {
        const currentAssignmentId = selectors.getCurrentAssignmentId(getState());

        if (assignmentId === currentAssignmentId) {
            notify.warning(gettext('The Assignment you were viewing was removed.'));
            dispatch(assignments.ui.closePreview());
        }

        return Promise.resolve();
    }
);

/**
 * WS Action when a new Assignment item is created
 * @param {object} _e - Event object
 * @param {object} data - Assignment, User, Desk IDs
 */
const onAssignmentCreated = (_e, data) => (
    (dispatch, getState, {desks}) => {
        // If this planning item was updated by this user in AddToPlanning Modal
        // Then ignore this notification
        if (selectors.general.sessionId(getState()) === data.session && (
            selectors.general.modalType(getState()) === MODALS.ADD_TO_PLANNING ||
            selectors.general.previousModalType(getState()) === MODALS.ADD_TO_PLANNING
        )) {
            return;
        }

        const currentDesk = assignmentUtils.getCurrentSelectedDeskId(desks, getState());

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

        if (querySearchSettings.deskIds == null || querySearchSettings.deskIds.length > 0 &&
            (currentDesk === data.assigned_desk || currentDesk === data.original_assigned_desk)
        ) {
            dispatch(assignments.ui.reloadAssignments([data.assignment_state], false));
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
    (dispatch, getState, {desks}) => {
        // If this planning item was updated by this user in AddToPlanning Modal
        // Then ignore this notification
        if (selectors.general.sessionId(getState()) === data.session && (
            selectors.general.modalType(getState()) === MODALS.ADD_TO_PLANNING ||
            selectors.general.previousModalType(getState()) === MODALS.ADD_TO_PLANNING
        )) {
            return;
        }

        const currentDesk = assignmentUtils.getCurrentSelectedDeskId(desks, getState());
        let querySearchSettings = selectors.getAssignmentSearch(getState());

        dispatch(updatePlanningRelatedToAssignment(data));

        // Updates my assignments count
        dispatch(
            assignments.ui.queryAndGetMyAssignments(
                [
                    ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
                    ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED,
                ]
            )
        );

        if ((querySearchSettings.deskIds?.length ?? 0) === 0 ||
            currentDesk === data.assigned_desk ||
            currentDesk === data.original_assigned_desk
        ) {
            dispatch(assignments.api.fetchAssignmentHistory({_id: data.item}));
            dispatch(assignments.ui.reloadAssignments([data.assignment_state], false));

            dispatch(assignments.api.fetchAssignmentById(data.item))
                .then((assignmentInStore) => {
                    // If assignment moved from one state to another, check if group changed
                    // And trigger reload
                    if (assignmentInStore.assigned_to.state !== data.assignment_state) {
                        const visibleGroups = selectors.getAssignmentGroups(getState());
                        const originalGroups = assignmentUtils.getAssignmentGroupsByStates(
                            visibleGroups,
                            [assignmentInStore.assigned_to.state]
                        );
                        const newGroups = assignmentUtils.getAssignmentGroupsByStates(
                            visibleGroups,
                            [data.assignment_state]
                        );

                        if (newGroups[0] !== originalGroups[0]) {
                            dispatch(assignments.ui.reloadAssignments(
                                [assignmentInStore.assigned_to.state],
                                false,
                            ));
                        }
                    }
                });

            const state = getState();

            if (data.assignment_state === ASSIGNMENTS.WORKFLOW_STATE.CANCELLED ||
                data.assignment_state === ASSIGNMENTS.WORKFLOW_STATE.IN_PROGRESS
            ) {
                // If we are in authoring workspace (fulfilment) and assignment is previewed,
                // close it
                if (selectors.general.currentWorkspace(state) === WORKSPACE.AUTHORING
                    && selectors.getCurrentAssignmentId(state) === data.item
                ) {
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

                        planningApi.locks.setItemAsUnlocked({
                            item: data.item,
                            etag: data.etag,
                            from_ingest: false,
                            type: 'assignment',
                        });
                        dispatch({
                            type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
                            payload: {assignment: item},
                        });
                    }
                });
        }
    }
);

/**
 * Synchronizes editor state with updated planning coverages after assignment changes
 * When assignments are modified (desk changed, state changed to in-progress, etc.), the planning
 * editor's coverage data becomes stale. This action refreshes the editor form and autosave with
 * the latest coverage information from the server.
 * @param {string} planningId - The planning item ID
 * @param {IPlanningItem[]} loadedPlannings - Planning items freshly loaded from server
 * @returns {Function} Thunk action that syncs the editor if the planning item is currently being edited
 */
const syncEditorWithUpdatedPlanning = (planningId: string, loadedPlannings: IPlanningItem[]) => (
    (dispatch, getState: GetStateFunc) => {
        const currentState = getState();
        const editorSelectors = selectors.editors.editorSelectors[EDITOR_TYPE.INLINE];
        const editorDiff = cloneDeep(editorSelectors.getEditorDiff(currentState));

        // only update if this planning item is currently being edited
        if (editorDiff?._id === planningId && loadedPlannings.length > 0) {
            const updatedDiff = {
                ...editorDiff,
                coverages: loadedPlannings[0]?.coverages || []
            };

            dispatch(editorsActions.setFormDiff(EDITOR_TYPE.INLINE, updatedDiff));

            const autosaves = selectors.forms.autosaves(currentState);
            const autosaveItem = getAutosaveItem(
                autosaves,
                ITEM_TYPE.PLANNING,
                planningId
            );

            return planningApi.autosave.save(autosaveItem, updatedDiff as IEventOrPlanningItem);
        }

        return Promise.resolve();
    }
);

/**
 * Updates planning item when its related assignment changes
 * Reloads the planning item's coverages from the server and synchronizes them with the editor
 * if the planning item is currently being edited. Also updates the item history.
 * @param {object} data - Assignment notification data containing planning and coverage IDs
 * @returns {Function} Thunk action that performs the update
 */
const updatePlanningRelatedToAssignment = (data) => (
    async(dispatch, getState: GetStateFunc) => {
        const state = getState();
        const plans = selectors.planning.storedPlannings(state);

        if (!get(data, 'planning')) return;

        const planningItem = cloneDeep(get(plans, data.planning, {}));

        if (!isExistingItem(planningItem)) return;

        let coverages = get(planningItem, 'coverages') || [];
        let coverage = coverages.find((cov) => cov.coverage_id === data.coverage);

        if (!coverage) return;

        const loadedPlannings = await dispatch(planningApis.loadPlanningByIds([data.planning]));

        await dispatch(syncEditorWithUpdatedPlanning(data.planning, loadedPlannings));
        await dispatch(main.fetchItemHistory(planningItem));
    }
);

function onAssignmentLocked(_e, data: IWebsocketMessageData['ITEM_LOCKED']) {
    return (dispatch) => {
        if (get(data, 'item') && data.clientId !== superdeskApi.session.getUniqueClientId()) {
            planningApi.locks.setItemAsLocked(data);

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
    };
}

/**
 * WS Action when a Planning item gets unlocked
 * If the Planning Item is unlocked don't fetch it. Just update the store directly by a dispatch.
 * This is done because backend Eve caching is returning old objects on subsequent fetch if locking
 * is applied.
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
function onAssignmentUnlocked(_e, data: IWebsocketMessageData['ITEM_UNLOCKED']) {
    return (dispatch, getState) => {
        if (get(data, 'item') && data.clientId !== superdeskApi.session.getUniqueClientId()) {
            planningApi.locks.setItemAsUnlocked(data);
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
    };
}

/**
 * WS Action when an Assignment is deleted
 * @param {object} _e - Event object
 * @param {object} data - IDs for the Assignment, Planning and Coverage items
 */
const onAssignmentRemoved = (_e, data) => (
    (dispatch, getState, {notify}) => {
        if (get(data, 'assignments')) {
            dispatch({
                type: ASSIGNMENTS.ACTIONS.REMOVE_ASSIGNMENT,
                payload: data,
            });

            data.assignments.forEach((a) => {
                dispatch(_notifyAssignmentEdited(a));
                // Though assignment is removed, this is to remove the orphan lock in the store
                dispatch({
                    type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
                    payload: {assignment: {_id: a}},
                });
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

            return dispatch(updatePlanningRelatedToAssignment(data));
        }

        return Promise.resolve();
    }
);

const onAssignmentDeleteFailed = (_e, data) => (
    (_dispatch, getState, {notify}) => {
        const currentUserId = selectors.general.currentUserId(getState());
        const sessionId = selectors.general.sessionId(getState());

        if ((data.items?.length ?? 0) > 0 &&
            data.user === currentUserId &&
            data.session === sessionId
        ) {
            const msg = data.items.map((i) => gettext(
                'There is a {{ type }} assignment \'{{ slugline }}\' {{ state }}',
                {
                    state: get(i, 'state'),
                    type: get(i, 'type'),
                    slugline: get(i, 'slugline'),
                }
            )).join('\n');

            notify.warning(msg);
        }

        return Promise.resolve();
    }
);

const onAssignmentDeleted = (_e, data) => (
    (dispatch, getState, {notify}) => {
        const currentWorkspace = selectors.general.currentWorkspace(getState());

        if (get(data, 'items.length', 0) > 0 && currentWorkspace === WORKSPACE.ASSIGNMENTS) {
            const msg = data.items.map((i) => gettext('{{ type }} assignment \'{{ slugline }}\' is deleted',
                {
                    type: get(i, 'type'),
                    slugline: get(i, 'slugline'),
                })).join('\n');

            notify.warning(msg);
            data.items.forEach((item) => {
                dispatch(_notifyAssignmentEdited(item.id));
            });

            // Load all assignment groups as the assignment deleted can be in any state
            dispatch(assignments.ui.reloadAssignments());
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
    onAssignmentDeleteFailed,
    onAssignmentDeleted,
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
    'assignments:delete:fail': () => (self.onAssignmentDeleteFailed),
    'assignments:delete': () => (self.onAssignmentDeleted),
    'assignments:accepted': () => (self.onAssignmentUpdated),
};

export default self;
