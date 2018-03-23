import {get} from 'lodash';
import planning from './index';
import {lockUtils, gettext} from '../../utils';
import * as selectors from '../../selectors';
import {showModal, hideModal, events} from '../index';
import main from '../main';
import {PLANNING, MODALS} from '../../constants';
import eventsPlanning from '../eventsPlanning';

/**
 * WS Action when a new Planning item is created
 * @param {object} _e - Event object
 * @param {object} data - Planning and User IDs
 */
const onPlanningCreated = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            if (get(data, 'event_item', null) !== null) {
                dispatch(events.api.markEventHasPlannings(
                    data.event_item,
                    data.item
                ));
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
        if (get(data, 'item')) {
            dispatch(planning.ui.scheduleRefetch())
                .then((items) => {
                    const selectedItems = selectors.getSelectedPlanningItems(getState());
                    const currentPreviewId = selectors.main.previewId(getState());
                    const currentEditId = selectors.forms.currentItemId(getState());

                    const loadedFromRefetch = selectedItems.indexOf(data.item) !== -1 &&
                        !items.find((plan) => plan._id === data.item);

                    if (!loadedFromRefetch && (currentPreviewId === data.item || currentEditId === data.item)) {
                        dispatch(planning.api.fetchById(data.item, {force: true}));
                    }

                    dispatch(eventsPlanning.ui.scheduleRefetch());
                });
        }

        return Promise.resolve();
    }
);

const onPlanningLocked = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
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
            let planningItem = selectors.getStoredPlannings(getState())[data.item];
            const locks = selectors.locks.getLockedItems(getState());
            const itemLock = lockUtils.getLock(planningItem, locks);
            const sessionId = selectors.getSessionDetails(getState()).sessionId;

            // If this is the planning item currently being edited, show popup notification
            if (itemLock !== null &&
                data.lock_session !== sessionId &&
                itemLock.session === sessionId
            ) {
                const user = selectors.getUsers(getState()).find((u) => u._id === data.user);

                const modalType = selectors.getCurrentModalType(getState());

                if (modalType !== MODALS.ADD_TO_PLANNING) {
                    dispatch(hideModal());
                }

                dispatch(showModal({
                    modalType: MODALS.NOTIFICATION_MODAL,
                    modalProps: {
                        title: 'Item Unlocked',
                        body: 'The planning item you were editing was unlocked by "' +
                            user.display_name + '"',
                    },
                }));
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

            return Promise.resolve();
        }
    }
);

const onPlanningPublished = (_e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.ui.scheduleRefetch());
            dispatch(eventsPlanning.ui.scheduleRefetch());
        }

        return Promise.resolve();
    }
);

const onPlanningSpiked = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            dispatch({
                type: PLANNING.ACTIONS.SPIKE_PLANNING,
                payload: {
                    id: data.item,
                    state: data.state,
                    revert_state: data.revert_state,
                    etag: data.etag,
                }
            });

            dispatch(main.closePreviewAndEditorForItems(
                [{_id: data.item}],
                gettext('The Planning item was spiked')
            ));

            dispatch(main.setUnsetLoadingIndicator(true));
            return dispatch(planning.ui.scheduleRefetch())
                .then(() => dispatch(eventsPlanning.ui.scheduleRefetch()))
                .finally(() => dispatch(main.setUnsetLoadingIndicator(false)));
        }

        return Promise.resolve();
    }
);

const onPlanningUnspiked = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            dispatch({
                type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                payload: {
                    id: data.item,
                    state: data.state,
                    etag: data.etag,
                }
            });

            dispatch(main.closePreviewAndEditorForItems(
                [{_id: data.item}],
                gettext('The Planning item was unspiked')
            ));

            dispatch(main.setUnsetLoadingIndicator(true));
            return dispatch(planning.ui.scheduleRefetch())
                .then(() => dispatch(eventsPlanning.ui.scheduleRefetch()))
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
        }
    }
);

const onCoverageCancelled = (e, data) => (
    (dispatch) => {
        if (get(data, 'planning_item') && get(data, 'ids')) {
            dispatch(planning.api.markCoverageCancelled(
                data.planning_item,
                get(data, 'reason'),
                get(data, 'coverage_state'),
                data.ids
            ));
        }
    }
);

const onPlanningRescheduled = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(planning.api.loadPlanningById(data.item));
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
        }
    }
);

// eslint-disable-next-line consistent-this
const self = {
    onPlanningCreated,
    onPlanningUpdated,
    onPlanningUnlocked,
    onPlanningPublished,
    onPlanningSpiked,
    onPlanningUnspiked,
    onPlanningCancelled,
    onCoverageCancelled,
    onPlanningRescheduled,
    onPlanningPostponed,
    onPlanningLocked,
};

// Map of notification name and Action Event to execute
self.events = {
    'planning:created': () => (self.onPlanningCreated),
    'planning:updated': () => (self.onPlanningUpdated),
    'planning:spiked': () => (self.onPlanningSpiked),
    'planning:unspiked': () => (self.onPlanningUnspiked),
    'planning:lock': () => (self.onPlanningLocked),
    'planning:unlock': () => (self.onPlanningUnlocked),
    'planning:published': () => (self.onPlanningPublished),
    'planning:duplicated': () => (self.onPlanningCreated),
    'planning:cancelled': () => (self.onPlanningCancelled),
    'coverage:cancelled': () => (self.onCoverageCancelled),
    'planning:rescheduled': () => (self.onPlanningRescheduled),
    'planning:postponed': () => (self.onPlanningPostponed),
};

export default self;
