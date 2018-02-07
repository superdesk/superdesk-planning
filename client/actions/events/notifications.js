import * as selectors from '../../selectors';
import {WORKFLOW_STATE, EVENTS, MODALS, SPIKED_STATE} from '../../constants';
import {showModal, hideModal} from '../index';
import eventsApi from './api';
import eventsUi from './ui';
import main from '../main';
import {get} from 'lodash';
import {lockUtils} from '../../utils';
import eventsPlanning from '../eventsPlanning';

/**
 * Action Event when an Event gets unlocked
 * @param _e
 * @param {object} data - Event and User IDs
 */
const onEventUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const events = selectors.getEvents(getState());
            const locks = selectors.locks.getLockedItems(getState());
            let eventInStore = get(events, data.item, {});
            const itemLock = lockUtils.getLock(eventInStore, locks);
            const sessionId = selectors.getSessionDetails(getState()).sessionId;

            // If this is the event item currently being edited, show popup notification
            if (itemLock !== null &&
                data.lock_session !== sessionId &&
                itemLock.session === sessionId
            ) {
                const user = selectors.getUsers(getState()).find((u) => u._id === data.user);

                dispatch(hideModal());
                dispatch(showModal({
                    modalType: MODALS.NOTIFICATION_MODAL,
                    modalProps: {
                        title: 'Item Unlocked',
                        body: 'The event you were editing was unlocked by "' +
                            user.display_name + '"',
                    },
                }));
            }

            eventInStore = {
                ...eventInStore,
                _id: data.item,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                _etag: data.etag,
            };

            dispatch({
                type: EVENTS.ACTIONS.UNLOCK_EVENT,
                payload: {event: eventInStore},
            });

            return Promise.resolve(eventInStore);
        }

        return Promise.resolve();
    }
);

const onEventLocked = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            return dispatch(eventsApi.getEvent(data.item, false))
                .then((eventInStore) => {
                    const evtInStore = {
                        ...eventInStore,
                        lock_action: data.lock_action || 'edit',
                        lock_user: data.user,
                        lock_session: data.lock_session,
                        lock_time: data.lock_time,
                        _etag: data.etag,
                    };

                    dispatch({
                        type: EVENTS.ACTIONS.LOCK_EVENT,
                        payload: {event: evtInStore},
                    });

                    return Promise.resolve(evtInStore);
                });
        }

        return Promise.resolve();
    }
);

const onEventSpiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            // Just update the event in store with updates and etag
            const events = selectors.getEvents(getState());

            let eventInStore = get(events, data.item, {});

            eventInStore = {
                ...eventInStore,
                _id: data.item,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                state: WORKFLOW_STATE.SPIKED,
                revert_state: data.revert_state,
                _etag: data.etag,
            };

            dispatch({
                type: EVENTS.ACTIONS.SPIKE_EVENT,
                payload: {
                    event: eventInStore,
                    spikeState: get(
                        selectors.main.eventsSearch(getState()),
                        'spikeState',
                        SPIKED_STATE.NOT_SPIKED
                    )
                },
            });

            dispatch(eventsPlanning.notifications.onEventSpiked(_e, data));
            dispatch(main.closePreviewAndEditorForItems([eventInStore]));

            return Promise.resolve(eventInStore);
        }

        return Promise.resolve();
    }
);

const onEventUnspiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const events = selectors.getEvents(getState());

            let eventInStore = get(events, data.item, {});

            eventInStore = {
                ...eventInStore,
                _id: data.item,
                lock_action: null,
                lock_user: null,
                lock_session: null,
                lock_time: null,
                state: data.state,
                revert_state: null,
                _etag: data.etag,
            };

            dispatch({
                type: EVENTS.ACTIONS.UNSPIKE_EVENT,
                payload: {
                    event: eventInStore,
                    spikeState: get(
                        selectors.main.eventsSearch(getState()),
                        'spikeState',
                        SPIKED_STATE.NOT_SPIKED
                    )
                },
            });

            dispatch(eventsPlanning.notifications.onEventUnspiked(_e, data));
            dispatch(main.closePreviewAndEditorForItems([eventInStore]));

            return Promise.resolve(eventInStore);
        }

        return Promise.resolve();
    }
);

const onEventCancelled = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(eventsApi.markEventCancelled(
                data.item,
                data.etag,
                data.reason,
                data.occur_status,
                get(data, 'cancelled_items') || []
            ));
        }
    }
);

const onEventScheduleChanged = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch(eventsUi.scheduleRefetch());
            dispatch(eventsPlanning.ui.scheduleRefetch());
            dispatch(eventsApi.getEvent(data.item, false));
        }
    }
);

const onEventPostponed = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            let events = selectors.getEvents(getState());

            if (data.item in events) {
                dispatch(eventsApi.markEventPostponed(
                    events[data.item],
                    data.reason
                ));
            }
        }
    }
);

const onEventPublishChanged = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            // Just update the event in store with updates and etag
            const events = selectors.getEvents(getState());

            let eventInStore = get(events, data.item, {});

            eventInStore = {
                ...eventInStore,
                _id: data.item,
                state: data.state,
                pubstatus: data.pubstatus,
                _etag: data.etag,
            };

            dispatch({
                type: data.state === WORKFLOW_STATE.SCHEDULED ?
                    EVENTS.ACTIONS.MARK_EVENT_PUBLISHED :
                    EVENTS.ACTIONS.MARK_EVENT_UNPUBLISHED,
                payload: {event: eventInStore},
            });

            return Promise.resolve(eventInStore);
        }

        return Promise.resolve();
    }
);

const onRecurringEventSpiked = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'items')) {
            dispatch({
                type: EVENTS.ACTIONS.SPIKE_RECURRING_EVENTS,
                payload: {
                    events: data.items,
                    recurrence_id: data.recurrence_id,
                    spikeState: get(
                        selectors.main.eventsSearch(getState()),
                        'spikeState',
                        SPIKED_STATE.NOT_SPIKED
                    )
                },
            });

            dispatch(eventsPlanning.notifications.onRecurringEventSpiked(e, data));
            dispatch(main.closePreviewAndEditorForItems(data.items));

            return Promise.resolve(data.items);
        }

        return Promise.resolve([]);
    }
);

// eslint-disable-next-line consistent-this
const self = {
    onEventLocked,
    onEventUnlocked,
    onEventSpiked,
    onEventUnspiked,
    onEventCancelled,
    onEventScheduleChanged,
    onEventPostponed,
    onEventPublishChanged,
    onRecurringEventSpiked,
};

// Map of notification name and Action Event to execute
self.events = {
    'events:lock': () => (self.onEventLocked),
    'events:unlock': () => (self.onEventUnlocked),
    'events:spiked': () => (self.onEventSpiked),
    'events:unspiked': () => (self.onEventUnspiked),
    'events:cancel': () => (self.onEventCancelled),
    'events:reschedule': () => (self.onEventScheduleChanged),
    'events:reschedule:recurring': () => (self.onEventScheduleChanged),
    'events:postpone': () => (self.onEventPostponed),
    'events:published': () => (self.onEventPublishChanged),
    'events:unpublished': () => (self.onEventPublishChanged),
    'events:spiked:recurring': () => (self.onRecurringEventSpiked),
    'events:update_time': () => (self.onEventScheduleChanged),
    'events:update_time:recurring': () => (self.onEventScheduleChanged),
};

export default self;
