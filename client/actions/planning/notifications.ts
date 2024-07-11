import {get} from 'lodash';

import {IWebsocketMessageData, ITEM_TYPE} from '../../interfaces';
import {planningApi} from '../../superdeskApi';

import {gettext, lockUtils} from '../../utils';
import {PLANNING, MODALS, WORKFLOW_STATE, WORKSPACE} from '../../constants';

import planning from './index';
import assignments from '../assignments/index';

import * as selectors from '../../selectors';
import {events, fetchAgendas} from '../index';
import main from '../main';
import {showModal, hideModal} from '../index';
import eventsPlanning from '../eventsPlanning';

/**
 * WS Action when a new Planning item is created
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningCreated = (_e: {}, data: IWebsocketMessageData['PLANNING_CREATED']) => (
    (dispatch, getState) => {
        if (data.item == null) {
            return Promise.resolve();
        } else if (selectors.general.sessionId(getState()) === data.session && (
            selectors.general.modalType(getState()) === MODALS.ADD_TO_PLANNING ||
            selectors.general.previousModalType(getState()) === MODALS.ADD_TO_PLANNING
        )) {
            // If this planning item was created by this user in AddToPlanning Modal
            // Then ignore this notification
            return Promise.resolve();
        }

        // Update Redux store to mark Event's to have Planning items
        for (let eventId of data.event_ids) {
            dispatch(events.api.markEventHasPlannings(eventId, data.item));
            dispatch(main.fetchItemHistory({_id: eventId, type: ITEM_TYPE.EVENT}));
        }

        dispatch(main.setUnsetLoadingIndicator(true));
        return dispatch(planning.ui.scheduleRefetch())
            .then(() => dispatch(eventsPlanning.ui.scheduleRefetch()))
            .finally(() => dispatch(main.setUnsetLoadingIndicator(false)));
    }
);

/**
 * WS Action when a Planning item gets updated, spiked or unspiked
 * If the Planning Item is not loaded, silently discard this notification
 */
const onPlanningUpdated = (_e: {}, data: IWebsocketMessageData['PLANNING_UPDATED']) => (
    (dispatch, getState) => {
        if (data.item == null) {
            return Promise.resolve();
        } else if (selectors.general.sessionId(getState()) === data.session && (
            selectors.general.modalType(getState()) === MODALS.ADD_TO_PLANNING ||
            selectors.general.previousModalType(getState()) === MODALS.ADD_TO_PLANNING
        )) {
            // If this planning item was update by this user in AddToPlanning Modal
            // Then ignore this notification
            return Promise.resolve();
        }

        // Update Redux store to mark Event's to have Planning items
        for (let eventId of data.event_ids) {
            dispatch(events.api.markEventHasPlannings(eventId, data.item));
            dispatch(main.fetchItemHistory({_id: eventId, type: ITEM_TYPE.EVENT}));
        }

        const promises = [];

        promises.push(dispatch(planning.ui.scheduleRefetch())
            .then((results) => {
                if (selectors.general.currentWorkspace(getState()) === WORKSPACE.ASSIGNMENTS) {
                    const currentPreviewId = selectors.main.previewId(getState());

                    if (currentPreviewId === data.item) {
                        dispatch(planning.api.fetchById(data.item, {force: true}));
                    }
                }

                dispatch(eventsPlanning.ui.scheduleRefetch());
            }));

        if (data.added_agendas.length > 0 || data.removed_agendas.length > 0) {
            promises.push(dispatch(fetchAgendas()));
        }

        promises.push(dispatch(main.fetchItemHistory({_id: data.item, type: ITEM_TYPE.PLANNING})));
        promises.push(dispatch(udpateAssignment(data.item)));
        promises.push(dispatch(planning.featuredPlanning.getAndUpdateStoredPlanningItem(data.item)));

        return Promise.all(promises);
    }
);

const onPlanningLocked = (e: {}, data: IWebsocketMessageData['ITEM_LOCKED']) => (
    (dispatch, getState) => {
        if (data.item != null) {
            planningApi.locks.setItemAsLocked(data);

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

                    dispatch(planning.featuredPlanning.updatePlanningMetadata(data.item));

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
function onPlanningUnlocked(_e: {}, data: IWebsocketMessageData['ITEM_UNLOCKED']) {
    return (dispatch, getState) => {
        if (data?.item != null) {
            const state = getState();
            let planningItem = selectors.planning.storedPlannings(state)[data.item];
            const isCurrentlyLocked = lockUtils.isItemLocked(planningItem, selectors.locks.getLockedItems(state));

            dispatch(main.onItemUnlocked(data, planningItem, ITEM_TYPE.PLANNING));

            if (!isCurrentlyLocked && planningItem?.lock_session == null) {
                // No need to announce an unlock, as we have already done so
                return Promise.resolve();
            }

            planningItem = {
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

            dispatch(planning.featuredPlanning.updatePlanningMetadata(data.item));

            return Promise.resolve();
        }
    };
}

const onPlanningPosted = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.ui.scheduleRefetch());
            dispatch(eventsPlanning.ui.scheduleRefetch());
            dispatch(main.fetchItemHistory({_id: data.item, type: ITEM_TYPE.PLANNING}));
            dispatch(eventsPlanning.ui.refetchPlanning(data.item));
            dispatch(planning.featuredPlanning.getAndUpdateStoredPlanningItem(data.item));
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

            dispatch(planning.featuredPlanning.getAndUpdateStoredPlanningItem(data.item));
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
            dispatch(planning.featuredPlanning.getAndUpdateStoredPlanningItem(data.item));

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
            dispatch(planning.featuredPlanning.getAndUpdateStoredPlanningItem(data.item));
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
        const promises = [];

        get(planningItem, 'coverages', []).forEach((cov) => {
            if (get(cov, 'assigned_to.assignment_id')) {
                promises.push(
                    dispatch(assignments.api.fetchAssignmentById(cov.assigned_to.assignment_id, true))
                );
                promises.push(
                    dispatch(assignments.api.fetchAssignmentHistory({_id: cov.assigned_to.assignment_id}))
                );
            }
        });

        return Promise.all(promises);
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
            dispatch(planning.featuredPlanning.setLockUser(data.user, data.lock_session));
        }
    }
);

const onPlanningFeaturedUnLocked = (_e, data) => (
    (dispatch, getState) => {
        if (data) {
            const currentSessionId = selectors.general.sessionId(getState());
            const lockSessionId = selectors.featuredPlanning.featureLockUser(getState());

            if (lockSessionId == null || lockSessionId === currentSessionId) {
                return;
            }

            dispatch(planning.featuredPlanning.setUnlocked());

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
const self: any = {
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
