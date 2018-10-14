import * as selectors from '../../selectors';
import {WORKFLOW_STATE, EVENTS, ITEM_TYPE} from '../../constants';
import eventsApi from './api';
import eventsUi from './ui';
import main from '../main';
import {get} from 'lodash';
import {gettext, dispatchUtils, getErrorMessage} from '../../utils';
import eventsPlanning from '../eventsPlanning';

/**
 * Action Event when a new Event is created
 * @param _e
 * @param {object} data - Events and User IDs
 */
const onEventCreated = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            return dispatch(eventsUi.scheduleRefetch())
                .then(() => dispatch(eventsPlanning.ui.scheduleRefetch()));
        }
    }
);

/**
 * Action Event when an Event gets unlocked
 * @param _e
 * @param {object} data - Event and User IDs
 */
const onEventUnlocked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const events = selectors.events.storedEvents(getState());
            let eventInStore = get(events, data.item, {});
            const sessionId = selectors.general.session(getState()).sessionId;

            dispatch(main.onItemUnlocked(data, eventInStore, ITEM_TYPE.EVENT));

            eventInStore = {
                recurrence_id: get(data, 'recurrence_id') || null,
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

            // reload the initial values of the editor if different session has made changes
            if (data.lock_session !== sessionId) {
                dispatch(main.reloadEditor(eventInStore));
            }

            return Promise.resolve(eventInStore);
        }

        return Promise.resolve();
    }
);

const onEventLocked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            const sessionId = selectors.general.session(getState()).sessionId;

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

                    // reload the initialvalues of the editor if different session has made changes
                    if (data.lock_session !== sessionId) {
                        dispatch(main.reloadEditor(eventInStore));
                    }

                    return Promise.resolve(evtInStore);
                });
        }

        return Promise.resolve();
    }
);

const onEventSpiked = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            dispatch({
                type: EVENTS.ACTIONS.SPIKE_EVENT,
                payload: {
                    item: data.item,
                    items: data.spiked_items,
                },
            });

            dispatch(main.closePreviewAndEditorForItems(
                data.spiked_items,
                gettext('The Event was spiked'),
                'id'
            ));

            dispatch(main.setUnsetLoadingIndicator(true));
            return dispatch(eventsUi.scheduleRefetch())
                .then(() => dispatch(eventsPlanning.ui.scheduleRefetch()))
                .finally(() => dispatch(main.setUnsetLoadingIndicator(false)));
        }

        return Promise.resolve();
    }
);

const onEventUnspiked = (_e, data) => (
    (dispatch) => {
        if (data && data.item) {
            dispatch({
                type: EVENTS.ACTIONS.UNSPIKE_EVENT,
                payload: {
                    item: data.item,
                    items: data.unspiked_items,
                },
            });

            dispatch(main.closePreviewAndEditorForItems(
                data.unspiked_items,
                gettext('The Event was unspiked'),
                'id'
            ));

            dispatch(main.setUnsetLoadingIndicator(true));
            return dispatch(eventsUi.scheduleRefetch())
                .then(() => dispatch(eventsPlanning.ui.scheduleRefetch()))
                .finally(() => dispatch(main.setUnsetLoadingIndicator(false)));
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
            dispatch(fetchItemHistoryOnRecurringNotitication(data));
        }
    }
);

const onEventScheduleChanged = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            dispatch(eventsUi.scheduleRefetch()); // Will update only 'events only' view
            dispatch(eventsPlanning.ui.scheduleRefetch()); // Will update only 'combined' view
            // Fetch the event if it is 'planning only' view
            if (selectors.main.isPlanningView(getState())) {
                dispatch(eventsApi.fetchById(data.item, {force: true}));
            }
            dispatch(fetchItemHistoryOnRecurringNotitication(data));
        }
    }
);

const onEventPostponed = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'item')) {
            let events = selectors.events.storedEvents(getState());

            if (data.item in events) {
                dispatch(eventsApi.markEventPostponed(
                    events[data.item],
                    data.reason
                ));
            }
            dispatch(fetchItemHistoryOnRecurringNotitication(data));
        }
    }
);

const onEventPostChanged = (e, data) => (
    (dispatch) => {
        if (get(data, 'item')) {
            dispatch({
                type: data.state === WORKFLOW_STATE.SCHEDULED ?
                    EVENTS.ACTIONS.MARK_EVENT_POSTED :
                    EVENTS.ACTIONS.MARK_EVENT_UNPOSTED,
                payload: {
                    item: data.item,
                    items: get(data, 'items', [{
                        id: data.item,
                        etag: data.etag,
                    }]),
                    state: data.state,
                    pubstatus: data.pubstatus,
                },
            });
            dispatch(fetchItemHistoryOnRecurringNotitication(data));
        }

        return Promise.resolve();
    }
);

/**
 * Action Event when a new Recurring Event is created
 * @param _e
 * @param {object} data - Recurring Event and user IDs
 */
const onRecurringEventCreated = (_e, data) => (
    (dispatch, getState, {notify}) => {
        if (data && data.item) {
            // Perform retryDispatch as the Elasticsearch index may not yet be created
            // (because we receive this notification fast, and we're performing a query not
            // a getById). So continue for 5 times, waiting 1 second between each request
            // until we receive the new events or an error occurs
            return dispatch(dispatchUtils.retryDispatch(
                eventsApi.query({
                    recurrenceId: data.item,
                    onlyFuture: false,
                }),
                (events) => get(events, 'length', 0) > 0,
                5,
                1000
            ))
            // Once we know our Recurring Events can be received from Elasticsearch,
            // go ahead and refresh the current list of events
                .then((items) => {
                    dispatch(eventsUi.scheduleRefetch());
                    dispatch(eventsPlanning.ui.scheduleRefetch());
                    return Promise.resolve(items);
                }, (error) => {
                    notify.error(getErrorMessage(
                        error,
                        'There was a problem fetching Recurring Events!'
                    ));
                });
        }
    }
);

/**
 * Action Event when an Event gets updated
 * @param _e
 * @param {object} data - Event and User IDs
 */
const onEventUpdated = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            dispatch(eventsUi.scheduleRefetch())
                .then((events) => {
                    const selectedEvents = selectors.multiSelect.selectedEvents(getState());
                    const currentPreviewId = selectors.main.previewId(getState());
                    const currentEditId = selectors.forms.currentItemId(getState());

                    const loadedFromRefetch = selectedEvents.indexOf(data.item) !== -1 &&
                        !events.find((event) => event._id === data.item);

                    dispatch(eventsPlanning.ui.scheduleRefetch()).then(() => {
                        if (!loadedFromRefetch && (currentPreviewId === data.item || currentEditId === data.item)) {
                            dispatch(eventsApi.fetchById(data.item, {force: true}));
                        }
                        dispatch(fetchItemHistoryOnRecurringNotitication(data));
                    });
                });
        }
    }
);

const fetchItemHistoryOnRecurringNotitication = (data) => (
    (dispatch, getState) => {
        if (data && data.item) {
            let item = {
                _id: data.item,
                recurrence_id: get(data, 'recurrence_id'),
                type: ITEM_TYPE.EVENT,
            };
            const previewItem = selectors.main.getPreviewItem(getState());
            const editItem = selectors.forms.currentItem(getState());

            if (!editItem && !previewItem) {
                return Promise.resolve();
            }

            if (!data.recurrence_id) {
                if (data.item === get(previewItem, '_id')) {
                    dispatch(main.fetchItemHistory(item));
                }

                if (data.item === get(editItem, '_id')) {
                    dispatch(main.fetchItemHistory(item));
                }
            } else {
                if (get(previewItem, 'recurrence_id') === data.recurrence_id) {
                    dispatch(main.fetchItemHistory(previewItem));
                }

                if (get(editItem, 'recurrence_id') === data.recurrence_id) {
                    dispatch(main.fetchItemHistory(editItem));
                }
            }
        }
    }
);

const onEventExpired = (_e, data) => (
    (dispatch) => {
        if (data && data.items) {
            dispatch({
                type: EVENTS.ACTIONS.EXPIRE_EVENTS,
                payload: data.items,
            });
        }
    }
);

// eslint-disable-next-line consistent-this
const self = {
    onEventCreated,
    onRecurringEventCreated,
    onEventUpdated,
    onEventLocked,
    onEventUnlocked,
    onEventSpiked,
    onEventUnspiked,
    onEventCancelled,
    onEventScheduleChanged,
    onEventPostponed,
    onEventPostChanged,
    onEventExpired,
};

// Map of notification name and Action Event to execute
self.events = {
    'events:created': () => (self.onEventCreated),
    'events:created:recurring': () => (self.onRecurringEventCreated),
    'events:updated': () => (self.onEventUpdated),
    'events:updated:recurring': () => (self.onEventUpdated),
    'events:lock': () => (self.onEventLocked),
    'events:unlock': () => (self.onEventUnlocked),
    'events:spiked': () => (self.onEventSpiked),
    'events:unspiked': () => (self.onEventUnspiked),
    'events:cancel': () => (self.onEventCancelled),
    'events:reschedule': () => (self.onEventScheduleChanged),
    'events:reschedule:recurring': () => (self.onEventScheduleChanged),
    'events:postpone': () => (self.onEventPostponed),
    'events:posted': () => (self.onEventPostChanged),
    'events:posted:recurring': () => (self.onEventPostChanged),
    'events:unposted': () => (self.onEventPostChanged),
    'events:unposted:recurring': () => (self.onEventPostChanged),
    'events:update_time': () => (self.onEventScheduleChanged),
    'events:update_time:recurring': () => (self.onEventScheduleChanged),
    'events:update_repetitions:recurring': () => (self.onEventScheduleChanged),
    'events:expired': () => self.onEventExpired,
};

export default self;
