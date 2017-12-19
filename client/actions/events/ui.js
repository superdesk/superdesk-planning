import {showModal, hideModal, locks} from '../index';
import {PRIVILEGES, EVENTS, PUBLISHED_STATE, MODALS, SPIKED_STATE, MAIN} from '../../constants';
import eventsApi from './api';
import {fetchSelectedAgendaPlannings} from '../agenda';
import main from '../main';
import * as selectors from '../../selectors';
import {get, last} from 'lodash';
import {
    checkPermission,
    getErrorMessage,
    lockUtils,
    isItemSpiked,
    isItemRescheduled,
} from '../../utils';
import {EventUpdateMethods} from '../../components/Events';

/**
 * Action Dispatcher to fetch events from the server
 * This will add the events to the events list,
 * and update the URL for deep linking
 * @param {object} params - Query parameters to send to the server
 * @return arrow function
 */
const fetchEvents = (params = {
    spikeState: SPIKED_STATE.NOT_SPIKED,
    page: 1,
}) => (
    (dispatch, getState, {$timeout, $location}) => {
        dispatch(self.requestEvents(params));

        return dispatch(eventsApi.query(params))
            .then((items) => {
                dispatch(eventsApi.receiveEvents(items));
                dispatch(self.setEventsList(items.map((e) => e._id)));
                // update the url (deep linking)
                $timeout(() => $location.search('searchParams', JSON.stringify(params)));
                return items;
            });
    }
);

/**
 * Action to open the Edit Event panel with the supplied Event
 * @param {object} event - The Event ID to edit
 * @return Promise
 */
const _openEventDetails = (event) => (
    (dispatch, getState) => {
        const id = get(event, '_id');

        if (id) {
            const openDetails = {
                type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
                payload: id,
            };

            // Load associated Planning items to ensure the 'Related Planning Items'
            // Toggle box shows relevant Planning items
            return dispatch(eventsApi.loadAssociatedPlannings(event))
                .then(() => {
                // In sessions with multiple tabs, state values of showEventDetails are different
                // So, explicitly get the event from the store and see if we hold the lock on it
                    const eventInState = {...selectors.getEvents(getState())[id]};
                    const eventLockedInThisSession = lockUtils.isItemLockedInThisSession(
                        eventInState,
                        selectors.getSessionDetails(getState())
                    );

                    if (eventInState && eventLockedInThisSession) {
                        dispatch(openDetails);
                        return Promise.resolve(eventInState);
                    }

                    if (isItemSpiked(eventInState)) {
                        dispatch(self.previewEvent(event));
                        return Promise.resolve(eventInState);
                    }

                    return dispatch(eventsApi.lock(event))
                        .then((item) => {
                            dispatch(openDetails);
                            return Promise.resolve(item);
                        }, () => {
                            dispatch(openDetails);
                            return Promise.resolve(event);
                        });
                });
        } else {
            dispatch({
                type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
                payload: true,
            });
            return Promise.resolve(event);
        }
    }
);

/**
 * If user has lock, opens event in edit. Otherwise previews it
 * @param {object} event - The Event ID to preview
 * @return Promise
 */
const previewEvent = (event) => (
    (dispatch, getState) => {
        const id = get(event, '_id');
        const eventInState = {...selectors.getEvents(getState())[id]};

        if (eventInState && lockUtils.isItemLockedInThisSession(eventInState,
            selectors.getSessionDetails(getState()))) {
            dispatch({
                type: EVENTS.ACTIONS.OPEN_EVENT_DETAILS,
                payload: id,
            });
        } else {
            dispatch(_previewEvent(event));
        }

        return Promise.resolve();
    }
);

/**
 * Action to close the Edit Event panel
 * @return Promise
 */
const closeEventDetails = () => (
    (dispatch, getState) => {
        if (selectors.isEventDetailLockedInThisSession(getState())) {
            const _event = selectors.getShowEventDetails(getState());

            dispatch(eventsApi.unlock({_id: _event}));
        }

        dispatch({type: EVENTS.ACTIONS.CLOSE_EVENT_DETAILS});
        return Promise.resolve();
    }
);

/**
 * Action to minimize the Edit Event panel
 * @return object
 */
const minimizeEventDetails = () => (
    {type: EVENTS.ACTIONS.CLOSE_EVENT_DETAILS}
);

/**
 * Unlock a Event and close editor if opened - used when item closed from workqueue
 * @param {object} item - The Event item to unlock
 * @return Promise
 */
const unlockAndCloseEditor = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.unlock({_id: item._id}))
            .then(() => {
                if (selectors.getHighlightedEvent(getState()) === item._id) {
                    dispatch(self.minimizeEventDetails());
                }

                return Promise.resolve(item);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Could not unlock the event.')
                );
                return Promise.reject(error);
            })
    )
);

/**
 * Action to unlock and open the Edit Event panel with the supplied Event
 * @param {object} event - The Event ID to edit
 * @return Promise
 */
const _unlockAndOpenEventDetails = (event) => (
    (dispatch) => (
        dispatch(locks.unlock(event))
            .then(() => {
                // Call openPlanningEditor to obtain a new lock for editing
                // Recurring events item resolved might not be the item we want to open
                // So, use original parameter (event) to open

                // (TEMPORARY!) Keeping this as preview until we finish new ui forms
                dispatch(main.preview(event));
            }, () => (Promise.reject()))
    )
);

/**
 * Spike an event and notify the user of the result
 * @param {object} event - The event to spike
 */
const spike = (item) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.spike(item))
            .then((events) => {
                dispatch(hideModal());
                notify.success('The event(s) have been spiked');
                if (get(selectors.events.showEventDetails(getState()), '_id') === item._id) {
                    dispatch(main.closePreview(null));
                }
                return Promise.resolve(events);
            }, (error) => {
                dispatch(hideModal());
                notify.error(
                    getErrorMessage(error, 'Failed to spike the event(s)')
                );

                return Promise.reject(error);
            })
    )
);

const _openBulkSpikeModal = (events) => (
    (dispatch) => {
        let eventsToSpike = Array.isArray(events) ? events : [events];

        dispatch(showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                body: `Do you want to spike these ${eventsToSpike.length} events?`,
                action: () => dispatch(self.spike(eventsToSpike)),
                deselectEventsAfterAction: true,
            },
        }));
    }
);

const _openUnspikeModal = (events) => (
    (dispatch) => {
        let eventsToUnspike = Array.isArray(events) ? events : [events];

        dispatch(showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                body: `Do you want to unspike these ${eventsToUnspike.length} events?`,
                action: () => dispatch(self.unspike(eventsToUnspike)),
                deselectEventsAfterAction: true,
            },
        }));
    }
);

const unspike = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.unspike(event))
            .then((events) => (
                Promise.all(
                    [
                        dispatch(self.refetchEvents()),
                        dispatch(fetchSelectedAgendaPlannings()),
                    ]
                )
                    .then(
                        () => {
                            dispatch(hideModal());

                            notify.success('The event(s) have been unspiked');
                            return Promise.resolve(events);
                        },

                        (error) => {
                            notify.error(
                                getErrorMessage(error, 'Failed to load events and plannings')
                            );

                            return Promise.reject(error);
                        }
                    )

            ), (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to spike the event(s)')
                );

                return Promise.reject(error);
            })
    )
);

/**
 * Action Dispatcher to re-fetch the current list of events.
 */
const refetchEvents = () => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.refetchEvents())
            .then((events) => {
                dispatch(self.setEventsList(events.map((e) => (e._id))));
                return Promise.resolve(events);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to refetch events')
                );

                return Promise.reject(error);
            })
    )
);

const cancelEvent = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.cancelEvent(event))
            .then(() => {
                dispatch(hideModal());
                notify.success('Event has been cancelled');

                return Promise.resolve();
            }, (error) => {
                dispatch(hideModal());

                notify.error(
                    getErrorMessage(error, 'Failed to cancel the Event!')
                );

                return Promise.reject(error);
            })
    )
);

const postponeEvent = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.postponeEvent(event))
            .then(() => {
                dispatch(hideModal());
                notify.success('Event has been postponed');

                return Promise.resolve();
            }, (error) => {
                dispatch(hideModal());

                notify.error(
                    getErrorMessage(error, 'Failed to postpone the Event!')
                );

                return Promise.reject(error);
            })
    )
);

const updateTime = (event, publish = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.UPDATE_TIME.label,
        EVENTS.ITEM_ACTIONS.UPDATE_TIME.lock_action,
        false,
        publish
    ))
);

const openSpikeModal = (event, publish = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.SPIKE.label,
        null,
        true,
        publish
    ))
);

const openCancelModal = (event, publish = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label,
        EVENTS.ITEM_ACTIONS.CANCEL_EVENT.lock_action,
        true,
        publish
    ))
);

const openPostponeModal = (event, publish = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label,
        EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.lock_action,
        true,
        publish
    ))
);

const openRescheduleModal = (event, publish = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label,
        EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.lock_action,
        true,
        publish,
        true
    ))
);

const convertToRecurringEvent = (event, publish) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label,
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.lock_action,
        false,
        publish,
        true
    ))
);

const _openActionModal = (
    event,
    action,
    lockAction = null,
    loadPlannings = false,
    publish = false,
    large = false
) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.lock(event, lockAction))
            .then((lockedEvent) => (
                dispatch(eventsApi.loadEventDataForAction(lockedEvent, loadPlannings, publish))
                    .then((eventDetail) => (
                        dispatch(showModal({
                            modalType: MODALS.ITEM_ACTIONS_MODAL,
                            modalProps: {
                                eventDetail: eventDetail,
                                actionType: action,
                                large: large,
                            },
                        }))
                    ), (error) => {
                        notify.error(
                            getErrorMessage(error, 'Failed to load associated Events')
                        );

                        return Promise.reject(error);
                    })
            ), (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to obtain the Event lock')
                );

                return Promise.reject(error);
            })
    )
);

const rescheduleEvent = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.rescheduleEvent(event))
            .then((updatedEvent) => {
                const duplicatedEvent = last(get(updatedEvent, 'duplicate_to', []));

                if (isItemRescheduled(updatedEvent) && duplicatedEvent) {
                    dispatch(main.preview({_id: duplicatedEvent}));
                } else {
                    dispatch(main.preview(event));
                }

                dispatch(hideModal());
                notify.success('Event has been rescheduled');

                return Promise.resolve();
            }, (error) => {
                dispatch(hideModal());

                notify.error(
                    getErrorMessage(error, 'Failed to reschedule the Event!')
                );

                return Promise.reject(error);
            })
    )
);

const saveAndPublish = (event, save = true, publish = false) => (
    (dispatch) => {
        if (!save) {
            if (publish) {
                return dispatch(self.publishEvent(event))
                    .then((publishedEvent) => {
                        dispatch(hideModal());
                        return Promise.resolve(publishedEvent);
                    });
            }

            dispatch(hideModal());
            return Promise.resolve(event);
        }

        return dispatch(eventsApi.save(event))
            .then((events) => {
                if (publish) {
                    return dispatch(self.publishEvent(events[0]))
                        .then(() => {
                            dispatch(hideModal());
                            return Promise.resolve(events);
                        });
                }

                dispatch(hideModal());
                return Promise.resolve(events);
            });
    }
);

const saveWithConfirmation = (event, save = true, publish = false) => (
    (dispatch, getState, {notify}) => {
        const events = selectors.getEvents(getState());
        const originalEvent = get(events, event._id, {});
        const maxRecurringEvents = selectors.config.getMaxRecurrentEvents(getState());

        // If this is not from a recurring series, then simply publish this event
        if (!get(originalEvent, 'recurrence_id')) {
            return dispatch(self.saveAndPublish(event, save, publish))
                .then((result) => Promise.resolve(result),
                    (error) => {
                        notify.error(
                            getErrorMessage(error, 'Failed to save the Event!')
                        );
                    });
        }

        return dispatch(eventsApi.query({
            recurrenceId: originalEvent.recurrence_id,
            maxResults: maxRecurringEvents,
            onlyFuture: false
        }))
            .then((relatedEvents) => (
                dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        eventDetail: {
                            ...event,
                            _recurring: relatedEvents || [event],
                            _publish: publish,
                            _save: save,
                            _events: [],
                            _originalEvent: originalEvent,
                        },
                        actionType: 'save',
                    },
                }))
            ));
    }
);

const publishEvent = (event) => (
    (dispatch, getState, {notify}) => {
        const updateMethod = get(event, 'update_method.value', EventUpdateMethods[0].value);

        if (get(event, '_recurring.length', 0) > 0 && updateMethod !== 'single') {
            let recurring;

            switch (updateMethod) {
            case 'future':
                recurring = event._recurring.filter((e) =>
                    e.dates.start.isSameOrAfter(event.dates.start) &&
                        get(e, 'pubstatus') !== PUBLISHED_STATE.USABLE
                );
                break;
            case 'all':
            default:
                recurring = event._recurring.filter((e) =>
                    get(e, 'pubstatus') !== PUBLISHED_STATE.USABLE
                );
                break;
            }

            const chunkSize = 5;
            let promise = Promise.resolve();
            let events = [];

            for (let i = 0; i < Math.ceil(recurring.length / chunkSize); i++) {
                let eventsChunk = recurring.slice(i * chunkSize, (i + 1) * chunkSize);

                promise = promise.then(() => (
                    Promise.all(
                        eventsChunk.map((e) => dispatch(eventsApi.publishEvent(e)))
                    )
                        .then((data) => {
                            data.forEach((e) => events.push(e));
                            notify.pop();
                            if (events.length < recurring.length) {
                                notify.success(`Published ${events.length}/${recurring.length} Events`);
                            }
                        })
                ));
            }

            return promise
                .then(() => {
                    notify.success(`Published ${recurring.length} Events`);
                    dispatch(self.closeEventDetails());
                    return Promise.resolve(events);
                });
        }

        return dispatch(eventsApi.publishEvent(event))
            .then((publishedEvent) => {
                notify.success('The event has been published');
                dispatch(self.closeEventDetails());
                return Promise.resolve(publishedEvent);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to publish the Event!')
                );
            });
    }
);

const unpublish = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.unpublish(event))
            .then((unpublishedEvent) => {
                notify.success('The Event has been published');
                return Promise.resolve(unpublishedEvent);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to unpublish the Event!')
                );
                return Promise.reject(error);
            })
    )
);


/**
 * Action to load more events
 */
const loadMore = () => (dispatch, getState) => {
    const previousParams = selectors.main.lastRequestParams(getState());
    const params = {
        ...previousParams,
        page: previousParams.page + 1,
    };

    dispatch(self.requestEvents(params));

    return dispatch(eventsApi.query(params))
        .then((items) => {
            dispatch(eventsApi.receiveEvents(items));
            dispatch(self.addToList(items.map((e) => e._id)));
        });
};

const requestEvents = (params = {}) => ({
    type: MAIN.ACTIONS.REQUEST,
    payload: {[MAIN.FILTERS.EVENTS]: params},
});

/**
 * Action to set the list of events in the current list
 * @param {Array} idsList - An array of Event IDs to assign to the current list
 * @return object
 */
const setEventsList = (idsList) => ({
    type: EVENTS.ACTIONS.SET_EVENTS_LIST,
    payload: idsList,
});

/**
 * Clears the Events List
 */
const clearList = () => ({type: EVENTS.ACTIONS.CLEAR_LIST});

/**
 * Action to add events to the current list
 * This action makes sure the list of events are unique, no duplicates
 * @param {array} eventsIds - An array of Event IDs to add
 * @return {{type: string, payload: *}}
 */
const addToList = (eventsIds) => ({
    type: EVENTS.ACTIONS.ADD_TO_EVENTS_LIST,
    payload: eventsIds,
});

/**
 * Opens the Event in preview/read-only mode
 * @param {object} event - The Event ID to preview
 * @return Promise
 */
const _previewEvent = (event) => ({
    type: EVENTS.ACTIONS.PREVIEW_EVENT,
    payload: get(event, '_id'),
});

/**
 * Action to open Event Advanced Search panel
 * @return object
 */
const openAdvancedSearch = () => (
    {type: EVENTS.ACTIONS.OPEN_ADVANCED_SEARCH}
);

/**
 * Action to close the Event Advanced Search panel
 * @return object
 */
const closeAdvancedSearch = () => (
    {type: EVENTS.ACTIONS.CLOSE_ADVANCED_SEARCH}
);

const openBulkSpikeModal = checkPermission(
    _openBulkSpikeModal,
    PRIVILEGES.SPIKE_EVENT,
    'Unauthorised to spike an Event'
);

const openUnspikeModal = checkPermission(
    _openUnspikeModal,
    PRIVILEGES.UNSPIKE_EVENT,
    'Unauthorised to unspike an Event'
);

const openEventDetails = checkPermission(
    _openEventDetails,
    PRIVILEGES.EVENT_MANAGEMENT,
    'Unauthorised to edit an event!',
    previewEvent
);

const unlockAndOpenEventDetails = checkPermission(
    _unlockAndOpenEventDetails,
    PRIVILEGES.PLANNING_UNLOCK,
    'Unauthorised to edit an event!'
);

/**
 * Action to receive the history of actions on Event and store them in the store
 * @param {array} eventHistoryItems - An array of Event History items
 * @return object
 */
const receiveEventHistory = (eventHistoryItems) => ({
    type: EVENTS.ACTIONS.RECEIVE_EVENT_HISTORY,
    payload: eventHistoryItems,
});

// eslint-disable-next-line consistent-this
const self = {
    fetchEvents,
    _openEventDetails,
    _unlockAndOpenEventDetails,
    _previewEvent,
    spike,
    unspike,
    refetchEvents,
    setEventsList,
    clearList,
    openSpikeModal,
    openBulkSpikeModal,
    openUnspikeModal,
    openEventDetails,
    unlockAndOpenEventDetails,
    closeEventDetails,
    previewEvent,
    openAdvancedSearch,
    closeAdvancedSearch,
    cancelEvent,
    openCancelModal,
    updateTime,
    minimizeEventDetails,
    unlockAndCloseEditor,
    openRescheduleModal,
    rescheduleEvent,
    postponeEvent,
    openPostponeModal,
    _openActionModal,
    convertToRecurringEvent,
    publishEvent,
    saveAndPublish,
    saveWithConfirmation,
    receiveEventHistory,
    unpublish,
    loadMore,
    addToList,
    requestEvents
};

export default self;
