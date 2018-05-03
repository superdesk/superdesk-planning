import {showModal, locks, main} from '../index';
import {PRIVILEGES, EVENTS, MODALS, SPIKED_STATE, MAIN, ITEM_TYPE, TEMP_ID_PREFIX} from '../../constants';
import eventsApi from './api';
import planningApi from '../planning/api';
import * as selectors from '../../selectors';
import {get} from 'lodash';
import moment from 'moment-timezone';
import {
    eventUtils,
    checkPermission,
    getErrorMessage,
    lockUtils,
    isItemSpiked,
    isItemRescheduled,
    dispatchUtils,
    gettext,
    getItemInArrayById,
    isExistingItem,
} from '../../utils';

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
        const filters = {
            ...selectors.events.getEventFilterParams(getState()),
            ...params,
        };

        dispatch(self.requestEvents(filters));
        return dispatch(eventsApi.query(filters, true))
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
                dispatch(main.lockAndEdit(event));
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
                notify.success(gettext('The event(s) have been spiked'));
                dispatch(main.closePreviewAndEditorForItems(events));
                return Promise.resolve(events);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to spike the event(s)'))
                );

                return Promise.reject(error);
            })
    )
);

const unspike = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.unspike(event))
            .then((events) => {
                notify.success(gettext('The event(s) have been unspiked'));
                dispatch(main.closePreviewAndEditorForItems(events));
                return Promise.resolve(events);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to spike the event(s)'))
                );

                return Promise.reject(error);
            })
    )
);

/**
 * Action Dispatcher to re-fetch the current list of events.
 */
const refetch = () => (
    (dispatch, getState, {notify}) => {
        if (!selectors.main.isEventsView(getState())) {
            return Promise.resolve([]);
        }

        return dispatch(eventsApi.refetch())
            .then((events) => {
                dispatch(self.setEventsList(events.map((e) => (e._id))));
                return Promise.resolve(events);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, 'Failed to refetch events')
                );

                return Promise.reject(error);
            });
    }
);


/**
 * Schedule the refetch to run after one second and avoid any other refetch
 */
let nextRefetch = {
    called: 0,
};
const scheduleRefetch = () => (
    (dispatch) => (
        dispatch(
            dispatchUtils.scheduleDispatch(self.refetch(), nextRefetch)
        )
    )
);

const cancelEvent = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.cancelEvent(event))
            .then(() => {
                notify.success(gettext('Event has been cancelled'));
                return Promise.resolve();
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to cancel the Event!'))
                );
                return Promise.reject(error);
            })
    )
);

const postponeEvent = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.postponeEvent(event))
            .then(() => {
                notify.success(gettext('Event has been postponed'));
                return Promise.resolve();
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to postpone the Event!'))
                );
                return Promise.reject(error);
            })
    )
);

const updateTime = (event, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.UPDATE_TIME.label,
        EVENTS.ITEM_ACTIONS.UPDATE_TIME.lock_action,
        false,
        post
    ))
);

const openSpikeModal = (event, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.SPIKE.label,
        null,
        true,
        post
    ))
);

const openUnspikeModal = (event, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.UNSPIKE.label,
        null,
        true,
        post
    ))
);

const openCancelModal = (event, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label,
        EVENTS.ITEM_ACTIONS.CANCEL_EVENT.lock_action,
        true,
        post,
        true
    ))
);

const openPostponeModal = (event, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label,
        EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.lock_action,
        true,
        post,
        false,
        false
    ))
);

const openRescheduleModal = (event, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label,
        EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.lock_action,
        true,
        post,
        true,
        false
    ))
);

const convertToRecurringEvent = (event, post) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label,
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.lock_action,
        false,
        post,
        true
    ))
);

const openRepetitionsModal = (event) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.label,
        EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.lock_action
    ))
);

const _openActionModal = (
    event,
    action,
    lockAction = null,
    loadPlannings = false,
    post = false,
    large = false,
    loadEvents = true
) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.lock(event, lockAction))
            .then((lockedEvent) => (
                dispatch(eventsApi.loadEventDataForAction(lockedEvent, loadPlannings, post, loadEvents))
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
                notify.success(gettext('Event has been rescheduled'));

                const duplicatedEvent = get(updatedEvent, 'reschedule_to');

                if (isItemRescheduled(updatedEvent) && duplicatedEvent) {
                    return dispatch(eventsApi.fetchById(duplicatedEvent))
                        .then(
                            (newEvent) => dispatch(main.lockAndEdit(newEvent)),
                            (error) => {
                                notify.error(
                                    getErrorMessage(error, gettext('Failed to load duplicated Event.'))
                                );

                                return Promise.reject(error);
                            }
                        );
                }

                return dispatch(main.lockAndEdit(updatedEvent));
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to reschedule the Event!'))
                );

                return Promise.reject(error);
            })
    )
);

const duplicate = (event) => (
    (dispatch, getState) => {
        const occurStatuses = selectors.vocabs.eventOccurStatuses(getState());
        const plannedStatus = getItemInArrayById(occurStatuses, 'eocstat:eos5', 'qcode') || {
            label: 'Planned, occurs certainly',
            qcode: 'eocstat:eos5',
            name: 'Planned, occurs certainly',
        };
        const newEvent = eventUtils.duplicateEvent(event, plannedStatus);

        return dispatch(main.lockAndEdit(newEvent));
    }
);

const updateEventTime = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.updateEventTime(event))
            .then(() => {
                notify.success(gettext('Event time has been updated'));
                return Promise.resolve();
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to update the Event time!'))
                );
                return Promise.reject(error);
            })
    )
);

const updateRepetitions = (event) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.updateRepetitions(event))
            .then((updatedEvent) => {
                notify.success(gettext('Event repetitions updated'));
                return Promise.resolve(updatedEvent);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to update Event repetitions'))
                );
                return Promise.reject(error);
            })
    )
);

const save = (event) => (
    (dispatch, getState, {notify}) =>
        dispatch(eventsApi.save(event))
);

const saveWithConfirmation = (event) => (
    (dispatch, getState) => {
        const events = selectors.getEvents(getState());
        const originalEvent = get(events, event._id, {});
        const maxRecurringEvents = selectors.config.getMaxRecurrentEvents(getState());

        // If this is not from a recurring series, then simply post this event
        if (!get(originalEvent, 'recurrence_id')) {
            return dispatch(eventsApi.save(event));
        }

        return dispatch(eventsApi.query({
            recurrenceId: originalEvent.recurrence_id,
            maxResults: maxRecurringEvents,
            onlyFuture: false,
        }))
            .then((relatedEvents) => (
                dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        eventDetail: {
                            ...event,
                            _recurring: relatedEvents || [event],
                            _events: [],
                            _originalEvent: originalEvent,
                        },
                        actionType: 'save',
                    },
                }))
            ));
    }
);

const postWithConfirmation = (event, post) => (
    (dispatch, getState) => {
        const events = selectors.getEvents(getState());
        const originalEvent = get(events, event._id, {});
        const maxRecurringEvents = selectors.config.getMaxRecurrentEvents(getState());

        // If this is not from a recurring series, then simply post this event
        if (!get(originalEvent, 'recurrence_id')) {
            return dispatch(post ?
                eventsApi.post(event) :
                eventsApi.unpost(event)
            );
        }

        return dispatch(eventsApi.query({
            recurrenceId: originalEvent.recurrence_id,
            maxResults: maxRecurringEvents,
            onlyFuture: false,
        }))
            .then((relatedEvents) => (
                dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        eventDetail: {
                            ...event,
                            _recurring: relatedEvents || [event],
                            _events: [],
                            _originalEvent: originalEvent,
                            _post: post,
                        },
                        actionType: EVENTS.ITEM_ACTIONS.POST_EVENT.label,
                    },
                }))
            ));
    }
);


/**
 * Action to load more events
 */
const loadMore = () => (dispatch, getState) => {
    const previousParams = selectors.main.lastRequestParams(getState());
    const totalItems = selectors.main.eventsTotalItems(getState());
    const eventIdsInList = selectors.events.eventIdsInList(getState());

    if (totalItems === get(eventIdsInList, 'length', 0)) {
        return Promise.resolve();
    }

    const params = {
        ...previousParams,
        page: get(previousParams, 'page', 1) + 1,
    };

    return dispatch(eventsApi.query(params, true))
        .then((items) => {
            if (get(items, 'length', 0) === MAIN.PAGE_SIZE) {
                dispatch(self.requestEvents(params));
            }
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

/**
 * Action to create a new Event from an existing Planning item
 * @param {object} plan - The Planning item to creat the Event from
 */
const createEventFromPlanning = (plan) => (
    (dispatch, getState) => {
        const defaultDurationOnChange = selectors.forms.defaultEventDuration(getState());
        const occurStatuses = selectors.vocabs.eventOccurStatuses(getState());
        const unplannedStatus = getItemInArrayById(occurStatuses, 'eocstat:eos0', 'qcode') || {
            label: 'Unplanned event',
            qcode: 'eocstat:eos0',
            name: 'Unplanned event',
        };

        return dispatch(planningApi.lock(plan, 'add_as_event'))
            .then(() =>
                dispatch(main.lockAndEdit({
                    type: ITEM_TYPE.EVENT,
                    dates: {
                        start: moment(plan.planning_date).clone(),
                        end: moment(plan.planning_date)
                            .clone()
                            .add(defaultDurationOnChange, 'h'),
                        tz: moment.tz.guess(),
                    },
                    slugline: plan.slugline,
                    name: plan.name || plan.slugline,
                    subject: plan.subject,
                    anpa_category: plan.anpa_category,
                    definition_short: plan.description_text,
                    calendars: [],
                    internal_note: plan.internal_note,
                    place: plan.place,
                    occur_status: unplannedStatus,
                    _planning_item: plan._id,
                    _tempId: TEMP_ID_PREFIX + moment().valueOf(),

                }))
            );
    }
);

/**
 * Action to select a specific Calendar and fetch the Events that satisfy the filter params as well.
 * @param {string} calendarId - The Calendar ID to select, defaults to 'All Calendars'
 * @param {object} params - The filter parameters
 */
const selectCalendar = (calendarId = '', params = {}) => (
    (dispatch, getState, {$timeout, $location}) => {
        const defaultCalendar = selectors.events.defaultCalendarFilter(getState());
        const calendar = calendarId || get(defaultCalendar, 'qcode') || EVENTS.FILTER.DEFAULT;

        dispatch({
            type: EVENTS.ACTIONS.SELECT_CALENDAR,
            payload: calendar,
        });

        // Update the url
        $timeout(() => $location.search('calendar', calendar));

        // Reload the Event list
        return dispatch(self.fetchEvents(params));
    }
);

const fetchEventWithFiles = (event) => (
    (dispatch) => {
        if (!isExistingItem(event) || get(event, 'files.length', 0) === 0) {
            return Promise.resolve(event);
        }

        return dispatch(eventsApi.fetchById(event._id, {force: true}));
    }
);

// eslint-disable-next-line consistent-this
const self = {
    fetchEvents,
    _openEventDetails,
    _unlockAndOpenEventDetails,
    _previewEvent,
    spike,
    unspike,
    refetch,
    scheduleRefetch,
    setEventsList,
    clearList,
    openSpikeModal,
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
    saveWithConfirmation,
    save,
    receiveEventHistory,
    loadMore,
    addToList,
    requestEvents,
    updateEventTime,
    duplicate,
    updateRepetitions,
    openRepetitionsModal,
    postWithConfirmation,
    createEventFromPlanning,
    selectCalendar,
    fetchEventWithFiles,
};

export default self;
