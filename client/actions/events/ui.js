import {showModal, main, locks} from '../index';
import {EVENTS, MODALS, SPIKED_STATE, MAIN, ITEM_TYPE, TEMP_ID_PREFIX} from '../../constants';
import eventsApi from './api';
import planningApi from '../planning/api';
import * as selectors from '../../selectors';
import {get} from 'lodash';
import moment from 'moment-timezone';
import {
    eventUtils,
    getErrorMessage,
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
            .then((updatedEvent) => {
                notify.success(gettext('Event has been postponed'));
                return Promise.resolve(updatedEvent);
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to postpone the Event!'))
                );
                return Promise.reject(error);
            })
    )
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

const openUpdateTimeModal = (event, post = false) => (
    self._openActionModalFromEditor({
        event: event,
        action: EVENTS.ITEM_ACTIONS.UPDATE_TIME,
        title: gettext('Save changes before updating the Event\'s time?'),
        loadPlannings: false,
        post: post,
        large: false,
        loadEvents: true,
    })
);

const openCancelModal = (event, post = false) => (
    self._openActionModalFromEditor({
        event: event,
        action: EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
        title: gettext('Save changes before cancelling the Event?'),
        loadPlannings: true,
        post: post,
        large: true,
        loadEvents: true,
        refetchBeforeFinalLock: true,
    })
);

const openPostponeModal = (event, post = false) => (
    self._openActionModalFromEditor({
        event: event,
        action: EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
        title: gettext('Save changes before postponing the Event?'),
        loadPlannings: true,
        post: post,
        large: false,
        loadEvents: false,
    })
);

const openRescheduleModal = (event, post = false) => (
    self._openActionModalFromEditor({
        event: event,
        action: EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
        title: gettext('Save changes before rescheduling the Event?'),
        loadPlannings: true,
        post: post,
        large: true,
        loadEvents: false,
    })
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

const _openActionModalFromEditor = ({
    event,
    action,
    title,
    loadPlannings = false,
    post = false,
    large = false,
    loadEvents = true,
    refetchBeforeFinalLock = false,
    modalProps = {},
} = {}) => (
    (dispatch) => (
        dispatch(main.openActionModalFromEditor(
            event,
            title,
            (updatedEvent, previousLock, openInEditor, openInModal) => (
                dispatch(self._openActionModal(
                    updatedEvent,
                    action.label,
                    action.lock_action,
                    loadPlannings,
                    post,
                    large,
                    loadEvents,
                    {
                        onCloseModal: (savedItem) => {
                            let promise = refetchBeforeFinalLock ?
                                dispatch(eventsApi.fetchById(savedItem._id, {force: true})) :
                                Promise.resolve(savedItem);

                            if (get(previousLock, 'action')) {
                                promise.then((refetchedEvent) => (
                                    (openInModal || openInModal) ?
                                        dispatch(main.lockAndEdit(refetchedEvent, openInModal)) :
                                        dispatch(locks.lock(refetchedEvent, previousLock.action))
                                ));
                            }

                            return promise;
                        },
                        ...modalProps,
                    }
                ))
            )
        ))
    )
);

const _openActionModal = (
    event,
    action,
    lockAction = null,
    loadPlannings = false,
    post = false,
    large = false,
    loadEvents = true,
    modalProps = {}
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
                                ...modalProps,
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
            .then((updatedEvent) => {
                notify.success(gettext('Event time has been updated'));
                return Promise.resolve(updatedEvent);
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

const saveWithConfirmation = (event) => (
    (dispatch, getState) => {
        const events = selectors.events.storedEvents(getState());
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
        const events = selectors.events.storedEvents(getState());
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
    spike,
    unspike,
    refetch,
    scheduleRefetch,
    setEventsList,
    clearList,
    openSpikeModal,
    openUnspikeModal,
    cancelEvent,
    openCancelModal,
    openUpdateTimeModal,
    openRescheduleModal,
    rescheduleEvent,
    postponeEvent,
    openPostponeModal,
    _openActionModal,
    convertToRecurringEvent,
    saveWithConfirmation,
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
    _openActionModalFromEditor,
};

export default self;
