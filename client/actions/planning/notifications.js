import {get} from 'lodash';
import planning from './index';
import assignments from '../assignments/index';
import {gettext} from '../../utils';
import * as selectors from '../../selectors';
import {events, fetchAgendas} from '../index';
import main from '../main';
import {PLANNING, ITEM_TYPE, MODALS, FEATURED_PLANNING, WORKFLOW_STATE, WORKSPACE} from '../../constants';
import {showModal, hideModal} from '../index';
import eventsPlanning from '../eventsPlanning';

/**
 * WS Action when a new Planning item is created
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningCreated = (_e, data) => (
    (dispatch, getState) => {
        // If this planning item was created by this user in AddToPlanning Modal
        // Then ignore this notification
        if (selectors.general.sessionId(getState()) === data.session && (
            selectors.general.modalType(getState()) === MODALS.ADD_TO_PLANNING ||
            selectors.general.previousModalType(getState()) === MODALS.ADD_TO_PLANNING
        )) {
            return;
        }

        if (get(data, 'item')) {
            if (get(data, 'event_item', null) !== null) {
                dispatch(events.api.markEventHasPlannings(
                    data.event_item,
                    data.item
                ));
                dispatch(main.fetchItemHistory({_id: data.event_item, type: ITEM_TYPE.EVENT}));
            }

            dispatch(main.setUnsetLoadingIndicator(true));
            return dispatch(planning.ui.scheduleRefetch())
                .then(() => dispatch(eventsPlanning.ui.scheduleRefetch()))
                .finally(() => dispatch(main.setUnsetLoadingIndicator(false)));
        }

        return Promise.resolve();
    }
);

/**
 * WS Action when a Planning item gets updated, spiked or unspiked
 * If the Planning Item is not loaded, silently discard this notification
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningUpdated = (_e, data) => (
    (dispatch, getState) => {
        // If this planning item was update by this user in AddToPlanning Modal
        // Then ignore this notification
        if (selectors.general.sessionId(getState()) === data.session && (
            selectors.general.modalType(getState()) === MODALS.ADD_TO_PLANNING ||
            selectors.general.previousModalType(getState()) === MODALS.ADD_TO_PLANNING
        )) {
            return;
        }

        if (get(data, 'item')) {
            dispatch(planning.ui.scheduleRefetch())
                .then((results) => {
                    if (selectors.general.currentWorkspace(getState()) === WORKSPACE.ASSIGNMENTS) {
                        const selectedItems = selectors.multiSelect.selectedPlannings(getState());
                        const currentPreviewId = selectors.main.previewId(getState());

                        const loadedFromRefetch = selectedItems.indexOf(data.item) !== -1 &&
                        !get(results, '[0]._items').find((plan) => plan._id === data.item);

                        if (!loadedFromRefetch && currentPreviewId === data.item) {
                            dispatch(planning.api.fetchById(data.item, {force: true}));
                        }
                    }

                    dispatch(eventsPlanning.ui.scheduleRefetch());
                });

            if (get(data, 'added_agendas.length', 0) > 0 || get(data, 'removed_agendas.length', 0) > 0) {
                dispatch(fetchAgendas());
            }
            dispatch(main.fetchItemHistory({_id: data.item, type: ITEM_TYPE.PLANNING}));
            dispatch(udpateAssignment(data.item));
            dispatch(planning.featuredPlanning.onPlanningUpdatedNotification(data.item));
        }

        return Promise.resolve();
    }
);

const onPlanningLocked = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            const sessionId = selectors.general.session(getState()).sessionId;

            return dispatch(planning.api.getPlanning(data.item, false))
                .then((planInStore) => {
                    let plan = {
                        ...planInStore,
                        lock_action: data.lock_action,
                        lock_user: data.user,
                        lock_session: data.lock_session,
                        lock_time: data.lock_time,
                        _etag: data.etag,
                    };

                    dispatch({
                        type: PLANNING.ACTIONS.LOCK_PLANNING,
                        payload: {plan: plan},
                    });

                    // reload the initialvalues of the editor if different session has made changes
                    if (data.lock_session !== sessionId) {
                        dispatch(main.reloadEditor(plan, 'read'));
                    }

                    return Promise.resolve(plan);
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
const onPlanningUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            let planningItem = selectors.planning.storedPlannings(getState())[data.item];

            dispatch(main.onItemUnlocked(data, planningItem, ITEM_TYPE.PLANNING));

            planningItem = {
                event_item: get(data, 'event_item') || null,
                recurrence_id: get(data, 'recurrence_id') || null,
                ...planningItem,
                _id: data.item,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                _etag: data.etag,
            };

            dispatch({
                type: PLANNING.ACTIONS.UNLOCK_PLANNING,
                payload: {plan: planningItem},
            });

            return Promise.resolve();
        }
    }
);

const onPlanningPosted = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.ui.scheduleRefetch());
            dispatch(eventsPlanning.ui.scheduleRefetch());
            dispatch(main.fetchItemHistory({_id: data.item, type: ITEM_TYPE.PLANNING}));
            dispatch(eventsPlanning.ui.refetchPlanning(data.item));
        }

        return Promise.resolve();
    }
);

const onPlanningSpiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            dispatch({
                type: PLANNING.ACTIONS.SPIKE_PLANNING,
                payload: {
                    id: data.item,
                    state: WORKFLOW_STATE.SPIKED,
                    revert_state: data.revert_state,
                    etag: data.etag,
                },
            });

            dispatch(main.closePreviewAndEditorForItems(
                [{_id: data.item}],
                selectors.general.currentUserId(getState()) === data.user ?
                    null :
                    gettext('The Planning item was spiked')
            ));

            dispatch(planning.featuredPlanning.removePlanningItemFromSelection(data.item));
            dispatch(main.setUnsetLoadingIndicator(true));
            return dispatch(planning.ui.scheduleRefetch())
                .then(() => {
                    dispatch(eventsPlanning.ui.refetchPlanning(data.item));
                    return dispatch(eventsPlanning.ui.scheduleRefetch());
                })
                .finally(() => dispatch(main.setUnsetLoadingIndicator(false)));
        }

        return Promise.resolve();
    }
);

const onPlanningUnspiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            dispatch({
                type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                payload: {
                    id: data.item,
                    state: data.state,
                    etag: data.etag,
                },
            });

            dispatch(main.closePreviewAndEditorForItems(
                [{_id: data.item}],
                selectors.general.currentUserId(getState()) === data.user ?
                    null :
                    gettext('The Planning item was unspiked')
            ));
            dispatch(planning.featuredPlanning.addPlanningItemToSelection(data.item));

            dispatch(main.setUnsetLoadingIndicator(true));
            return dispatch(planning.ui.scheduleRefetch())
                .then(() => {
                    dispatch(eventsPlanning.ui.refetchPlanning(data.item));
                    return dispatch(eventsPlanning.ui.scheduleRefetch());
                })
                .finally(() => dispatch(main.setUnsetLoadingIndicator(false)));
        }

        return Promise.resolve();
    }
);

const onPlanningCancelled = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.api.markPlanningCancelled(
                data.item,
                get(data, 'reason'),
                get(data, 'coverage_state'),
                get(data, 'event_cancellation')
            ));
            dispatch(main.fetchItemHistory({_id: data.item, type: ITEM_TYPE.PLANNING}));
            dispatch(udpateAssignment(data.item));
            dispatch(planning.featuredPlanning.removePlanningItemFromSelection(data.item));
        }
    }
);

const onCoverageCancelled = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'planning_item') && get(data, 'ids')) {
            dispatch(planning.api.markCoverageCancelled(
                data.planning_item,
                get(data, 'reason'),
                get(data, 'coverage_state'),
                data.ids,
                get(data, 'etag')
            ));
            dispatch(main.fetchItemHistory({_id: data.item, type: ITEM_TYPE.PLANNING}));
            dispatch(udpateAssignment(data.item));
        }
    }
);

const udpateAssignment = (planningId) => (
    (dispatch, getState) => {
        if (selectors.general.currentWorkspace(getState()) !== WORKSPACE.ASSIGNMENTS) {
            return Promise.resolve();
        }

        const planningItem = selectors.planning.storedPlannings(getState())[planningId];

        get(planningItem, 'coverages', []).forEach((cov) => {
            if (get(cov, 'assigned_to.assignment_id')) {
                dispatch(assignments.api.fetchAssignmentById(cov.assigned_to.assignment_id, true));
                dispatch(assignments.api.fetchAssignmentHistory({_id: cov.assigned_to.assignment_id}));
            }
        });
    }
);

const onPlanningRescheduled = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.api.loadPlanningById(data.item));
            dispatch(main.fetchItemHistory({_id: data.item, type: ITEM_TYPE.PLANNING}));
        }
    }
);

const onPlanningPostponed = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.api.markPlanningPostponed(
                data.item,
                get(data, 'reason')
            ));
            dispatch(main.fetchItemHistory({_id: data.item, type: ITEM_TYPE.PLANNING}));
        }
    }
);

const onPlanningExpired = (_e, data) => (
    (dispatch) => {
        if (data && data.items) {
            dispatch({
                type: PLANNING.ACTIONS.EXPIRE_PLANNING,
                payload: data.items,
            });
        }
    }
);

const onPlanningFeaturedLocked = (_e, data) => (
    (dispatch) => {
        if (data && data.user) {
            const payload = {
                lock_user: data.user,
                lock_session: data.lock_session,
            };

            dispatch({
                type: FEATURED_PLANNING.ACTIONS.LOCKED,
                payload: payload,
            });
        }
    }
);

const onPlanningFeaturedUnLocked = (_e, data) => (
    (dispatch, getState) => {
        if (data) {
            dispatch({type: FEATURED_PLANNING.ACTIONS.UNLOCKED});

            if (selectors.featuredPlanning.inUse(getState())) {
                const user = selectors.general.users(getState()).find((u) => u._id === data.user);

                // Close modal and send notification unlocked popup
                dispatch(planning.featuredPlanning.unsetFeaturePlanningInUse(false));
                dispatch(hideModal(true));
                dispatch(showModal({
                    modalType: MODALS.NOTIFICATION_MODAL,
                    modalProps: {
                        title: gettext('Featured Stories Unlocked'),
                        body: gettext('Featured stories you were managing was ' +
                            `unlocked by ${user.display_name}`),
                    }}));
            }
            return Promise.resolve();
        }
    }
);

const onPlanningFilesUpdated = (_e, data) => (
    (dispatch) => (dispatch(planning.api.getFiles([data.item])))
);

// eslint-disable-next-line consistent-this
const self = {
    onPlanningCreated,
    onPlanningUpdated,
    onPlanningUnlocked,
    onPlanningPosted,
    onPlanningSpiked,
    onPlanningUnspiked,
    onPlanningCancelled,
    onCoverageCancelled,
    onPlanningRescheduled,
    onPlanningPostponed,
    onPlanningLocked,
    onPlanningExpired,
    onPlanningFeaturedLocked,
    onPlanningFeaturedUnLocked,
    onPlanningFilesUpdated,
};

// Map of notification name and Action Event to execute
self.events = {
    'planning:created': () => (self.onPlanningCreated),
    'planning:updated': () => (self.onPlanningUpdated),
    'planning:spiked': () => (self.onPlanningSpiked),
    'planning:unspiked': () => (self.onPlanningUnspiked),
    'planning:lock': () => (self.onPlanningLocked),
    'planning:unlock': () => (self.onPlanningUnlocked),
    'planning:posted': () => (self.onPlanningPosted),
    'planning:duplicated': () => (self.onPlanningCreated),
    'planning:cancelled': () => (self.onPlanningCancelled),
    'coverage:cancelled': () => (self.onCoverageCancelled),
    'planning:rescheduled': () => (self.onPlanningRescheduled),
    'planning:postponed': () => (self.onPlanningPostponed),
    'planning:expired': () => self.onPlanningExpired,
    'planning_featured_lock:lock': () => self.onPlanningFeaturedLocked,
    'planning_featured_lock:unlock': () => onPlanningFeaturedUnLocked,
    'planning_files:updated': () => onPlanningFilesUpdated,
};

export default self;
