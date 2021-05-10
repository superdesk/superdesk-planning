import {get} from 'lodash';
import moment from 'moment-timezone';

import {appConfig} from 'appConfig';
import {IPlanningItem, IEventItem} from '../../interfaces';

import {showModal, main, locks, addEventToCurrentAgenda} from '../index';
import {EVENTS, MODALS, SPIKED_STATE, MAIN, ITEM_TYPE, POST_STATE} from '../../constants';
import eventsApi from './api';
import planningApi from '../planning/api';
import * as selectors from '../../selectors';
import {
    eventUtils,
    getErrorMessage,
    isItemRescheduled,
    dispatchUtils,
    gettext,
    getItemInArrayById,
    getPostedState,
    timeUtils,
    getItemId,
    isItemPublic,
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
const refetch = (skipEvents = []) => (
    (dispatch, getState, {notify}) => {
        if (!selectors.main.isEventsView(getState())) {
            return Promise.resolve([]);
        }

        return dispatch(eventsApi.refetch(skipEvents))
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
const scheduleRefetch = (skipEvents = []) => (
    (dispatch) => (
        dispatch(
            dispatchUtils.scheduleDispatch(self.refetch(skipEvents), nextRefetch)
        )
    )
);

const cancelEvent = (original, updates) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.cancelEvent(original, updates))
            .then(() => {
                notify.success(gettext('Event has been cancelled'));
                return dispatch(main.closePreviewAndEditorForItems([original]));
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to cancel the Event!'))
                );
                return Promise.reject(error);
            })
    )
);

const postponeEvent = (original, updates) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.postponeEvent(original, updates))
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

const openSpikeModal = (event, post = false, modalProps = {}) => (
    (dispatch) => (
        eventsApi.loadEventDataForAction(
            event,
            true,
            post,
            true,
            true
        ).then((eventWithData) => {
            dispatch(self._openActionModal(
                eventWithData,
                {},
                EVENTS.ITEM_ACTIONS.SPIKE.actionName,
                null,
                true,
                post,
                false,
                true,
                modalProps
            ));
        })
    )
);

const openUnspikeModal = (event, post = false) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        {},
        EVENTS.ITEM_ACTIONS.UNSPIKE.actionName,
        null,
        true,
        post
    ))
);

const openUpdateTimeModal = (event, post = false, fromEditor = true) => {
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: EVENTS.ITEM_ACTIONS.UPDATE_TIME,
            title: gettext('Save changes before updating the Event\'s time?'),
            loadPlannings: false,
            post: post,
            large: false,
            loadEvents: true,
        });
    } else {
        return self._openActionModal(
            event,
            {},
            EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName,
            null,
            true,
            post
        );
    }
};

const openCancelModal = (event, post = false, fromEditor = true) => {
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
            title: gettext('Save changes before cancelling the Event?'),
            loadPlannings: true,
            post: post,
            large: true,
            loadEvents: true,
            refetchBeforeFinalLock: true,
        });
    } else {
        return self._openActionModal(
            event,
            {},
            EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName,
            null,
            true,
            post
        );
    }
};

const openPostponeModal = (event, post = false, fromEditor = true) => {
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
            title: gettext('Save changes before postponing the Event?'),
            loadPlannings: true,
            post: post,
            large: false,
            loadEvents: false,
        });
    } else {
        return self._openActionModal(
            event,
            {},
            EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName,
            null,
            true,
            post
        );
    }
};

const openRescheduleModal = (event, post = false, fromEditor = true) => {
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
            title: gettext('Save changes before rescheduling the Event?'),
            loadPlannings: true,
            post: post,
            large: true,
            loadEvents: false,
        });
    } else {
        return self._openActionModal(
            event,
            {},
            EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName,
            null,
            true,
            post
        );
    }
};

const convertToRecurringEvent = (event, post) => (
    (dispatch) => dispatch(self._openActionModal(
        event,
        {},
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName,
        EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.lock_action,
        false,
        post,
        true
    ))
);

const openRepetitionsModal = (event, fromEditor = true) => {
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS,
            title: gettext('Save changes before updating Event Repetitions?'),
            refetchBeforeFinalLock: true,
        });
    } else {
        return self._openActionModal(
            event,
            {},
            EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName,
            EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.lock_action
        );
    }
};

const rescheduleEvent = (original, updates) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.rescheduleEvent(original, updates))
            .then((updatedEvent) => {
                notify.success(gettext('Event has been rescheduled'));

                const duplicatedEvent = get(updatedEvent, 'reschedule_to');
                const openEditor = (item) => {
                    const itemId = getItemId(item);
                    const editorItemId = selectors.forms.currentItemId(getState());
                    const editorModalItemId = selectors.forms.currentItemIdModal(getState());

                    if (editorItemId === itemId || editorModalItemId === itemId) {
                        dispatch(main.changeEditorAction(
                            'edit',
                            editorModalItemId === itemId
                        ));
                    } else {
                        dispatch(main.openForEdit(item));
                    }
                };

                if (isItemRescheduled(updatedEvent) && duplicatedEvent) {
                    return dispatch(eventsApi.fetchById(duplicatedEvent))
                        .then(
                            (newEvent) => {
                                openEditor(newEvent);

                                return Promise.resolve(newEvent);
                            },
                            (error) => {
                                notify.error(
                                    getErrorMessage(error, gettext('Failed to load duplicated Event.'))
                                );

                                return Promise.reject(error);
                            }
                        );
                }

                openEditor(updatedEvent);

                return Promise.resolve(updatedEvent);
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
            (original, previousLock, openInEditor, openInModal) => (
                dispatch(self._openActionModal(
                    original,
                    {},
                    action.actionName,
                    action.lock_action,
                    loadPlannings,
                    post,
                    large,
                    loadEvents,
                    {
                        onCloseModal: (savedItem) => {
                            let modifiedEvent = eventUtils.modifyForClient(savedItem);

                            let promise = refetchBeforeFinalLock ?
                                dispatch(eventsApi.fetchById(modifiedEvent._id, {force: true})) :
                                Promise.resolve(modifiedEvent);

                            if (get(previousLock, 'action')) {
                                promise.then((refetchedEvent) => (
                                    (openInEditor || openInModal) ?
                                        dispatch(main.openForEdit(refetchedEvent, !openInModal, openInModal)) :
                                        dispatch(locks.lock(refetchedEvent, previousLock.action))
                                ), () => Promise.reject());
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
    original,
    updates,
    action,
    lockAction = null,
    loadPlannings = false,
    post = false,
    large = false,
    loadEvents = true,
    modalProps = {}
) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.lock(original, lockAction))
            .then((lockedEvent) => (
                eventsApi.loadEventDataForAction(lockedEvent, loadPlannings, post, loadEvents)
                    .then((eventDetail) => (
                        dispatch(showModal({
                            modalType: MODALS.ITEM_ACTIONS_MODAL,
                            modalProps: {
                                original: eventDetail,
                                updates: updates,
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
        // If the event has files, get its entire file resource
        // To show in the edit form during duplication
        if (eventUtils.shouldFetchFilesForEvent(event)) {
            dispatch(eventsApi.fetchEventFiles(event, false));
        }

        const occurStatuses = selectors.vocabs.eventOccurStatuses(getState());
        const plannedStatus = getItemInArrayById(occurStatuses, 'eocstat:eos5', 'qcode') || {
            label: 'Planned, occurs certainly',
            qcode: 'eocstat:eos5',
            name: 'Planned, occurs certainly',
        };
        const newEvent = eventUtils.modifyForClient(
            eventUtils.duplicateEvent(event, plannedStatus)
        );

        return dispatch(main.createNew(
            ITEM_TYPE.EVENT,
            newEvent,
            true,
            selectors.forms.currentItemIdModal(getState())));
    }
);

const updateEventTime = (original, updates) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.updateEventTime(original, updates))
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

const updateRepetitions = (original, updates) => (
    (dispatch, getState, {notify}) => (
        dispatch(eventsApi.updateRepetitions(original, updates))
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

const saveWithConfirmation = (original, updates, unlockOnClose, ignoreRecurring = false) => (
    (dispatch) => {
        // If this is not from a recurring series, then simply post this event
        // Do the same if we need to ignore recurring event selection on purpose
        if (!get(original, 'recurrence_id') || ignoreRecurring) {
            return dispatch(eventsApi.save(original, updates));
        }

        return dispatch(eventsApi.query({
            recurrenceId: original.recurrence_id,
            maxResults: appConfig.max_recurrent_events,
            onlyFuture: false,
        }))
            .then((relatedEvents) => (
                dispatch(showModal({
                    modalType: MODALS.ITEM_ACTIONS_MODAL,
                    modalProps: {
                        original: {
                            ...original,
                            _recurring: relatedEvents || [original],
                            _events: [],
                            _originalEvent: original,
                        },
                        updates: updates,
                        actionType: 'save',
                        unlockOnClose: unlockOnClose,
                    },
                }))
            ));
    }
);

const postWithConfirmation = (original, updates, post) => (
    (dispatch) => {
        // If this is not from a recurring series, then simply post this event
        const hasPlannings = eventUtils.eventHasPlanning(original);

        if (!get(original, 'recurrence_id') && !hasPlannings) {
            return dispatch(post ?
                eventsApi.post(original, updates) :
                eventsApi.unpost(original, updates)
            );
        }

        return dispatch(self.openEventPostModal(original, updates, post));
    }
);

const openEventPostModal = (
    original,
    updates,
    post,
    unpostAction,
    modalProps = {},
    planningItem = null,
    planningAction = null) => (
    (dispatch) => {
        let promise = Promise.resolve(original);

        if (planningItem) {
            // Actually posting a planning item
            if (!planningItem.event_item || !planningItem.recurrence_id) {
                // Adhoc planning item or does not belong to recurring series
                return dispatch(planningAction()).then((p) => Promise.resolve(p));
            }

            promise = dispatch(eventsApi.fetchById(planningItem.event_item, {force: true, loadPlanning: false}));
        }

        return promise.then((fetchedEvent) => {
            if (planningItem && isItemPublic(fetchedEvent)) {
                return dispatch(planningAction()).then((p) => Promise.resolve(p));
            }

            return eventsApi.loadEventDataForAction(
                fetchedEvent,
                true,
                post,
                true,
                true
            ).then((eventWithData) => {
                if (!post &&
                    !eventWithData.recurrence_id &&
                    !eventUtils.eventHasPostedPlannings(eventWithData)
                ) {
                    // Not a recurring event and has no posted planning items to confirm unpost
                    // Just unpost
                    return dispatch(!unpostAction ?
                        eventsApi.unpost(fetchedEvent, updates) :
                        unpostAction(fetchedEvent, updates)
                    );
                }

                return new Promise((resolve, reject) => {
                    dispatch(showModal({
                        modalType: MODALS.ITEM_ACTIONS_MODAL,
                        modalProps: {
                            resolve: resolve,
                            reject: reject,
                            original: eventWithData,
                            updates: updates,
                            actionType: modalProps.actionType ?
                                modalProps.actionType :
                                EVENTS.ITEM_ACTIONS.POST_EVENT.actionName,
                            planningItem: planningItem,
                            planningAction: planningAction,
                            ...modalProps,
                        },
                    }));
                }).then((rtn) => Promise.resolve(rtn));
            });
        });
    }
);

const openAssignCalendarModal = (original, updates) => (
    (dispatch) => dispatch(self._openActionModal(
        original,
        updates,
        EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName,
        'assign_calendar',
        false,
        false,
        false,
        true,
        {}
    ))
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

// Action to set the list of events in the current list
function setEventsList(ids: Array<IEventItem['_id']>) {
    return (dispatch, getState) => {
        dispatch({
            type: EVENTS.ACTIONS.SET_EVENTS_LIST,
            payload: {
                ids: ids,
                listViewType: selectors.main.getCurrentListViewType(getState()),
            },
        });
    };
}

/**
 * Clears the Events List
 */
const clearList = () => ({type: EVENTS.ACTIONS.CLEAR_LIST});

/**
 * Action to add events to the current list
 * This action makes sure the list of events are unique, no duplicates
 */
function addToList(ids: Array<IEventItem['_id']>) {
    return (dispatch, getState) => {
        dispatch({
            type: EVENTS.ACTIONS.ADD_TO_EVENTS_LIST,
            payload: {
                ids: ids,
                listViewType: selectors.main.getCurrentListViewType(getState()),
            },
        });
    };
}

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
const createEventFromPlanning = (plan: IPlanningItem) => (
    (dispatch, getState) => {
        const defaultDurationOnChange = selectors.forms.defaultEventDuration(getState());
        const occurStatuses = selectors.vocabs.eventOccurStatuses(getState());
        const unplannedStatus = getItemInArrayById(occurStatuses, 'eocstat:eos0', 'qcode') || {
            label: 'Unplanned event',
            qcode: 'eocstat:eos0',
            name: 'Unplanned event',
        };
        const eventProfile = selectors.forms.eventProfile(getState());
        const newEvent: Partial<IEventItem> = {
            dates: {
                start: moment(plan.planning_date).clone(),
                end: moment(plan.planning_date)
                    .clone()
                    .add(defaultDurationOnChange, 'h'),
                tz: moment.tz.guess(),
            },
            name: plan.name || plan.slugline,
            subject: plan.subject,
            anpa_category: plan.anpa_category,
            definition_short: plan.description_text,
            calendars: [],
            internal_note: plan.internal_note,
            place: plan.place,
            occur_status: unplannedStatus,
            _planning_item: plan._id,
            language: plan.language,
        };

        if (get(eventProfile, 'editor.slugline.enabled', false)) {
            newEvent.slugline = plan.slugline;
        }

        return Promise.all([
            dispatch(planningApi.lock(plan, 'add_as_event')),
            dispatch(main.createNew(ITEM_TYPE.EVENT, newEvent)),
        ]);
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
        dispatch(main.setUnsetUserInitiatedSearch(true));
        return dispatch(self.fetchEvents(params))
            .then((data) => Promise.resolve(data))
            .finally(() => dispatch(main.setUnsetUserInitiatedSearch(false)));
    }
);

const onEventEditUnlock = (event) => (
    (dispatch) => (
        get(event, '_planning_item') ? dispatch(planningApi.unlock({_id: event._planning_item})) :
            Promise.resolve()
    )
);

const lockAndSaveUpdates = (
    event,
    updates,
    lockAction,
    successNotification,
    failureNotification,
    recurringModalAction,
    openRecurringModal = true) => (
    (dispatch, getState, {notify}) => {
        // If this is a recurring event, then open the modal
        // so the user can select which Events to action on
        // Note: Some actions don't need this if it is a recurring event
        // Eg. "Mark event as complete"
        if (get(event, 'recurrence_id') && openRecurringModal && recurringModalAction) {
            return dispatch(recurringModalAction(event, updates));
        }

        // Otherwise lock, save and unlock this Event
        return dispatch(locks.lock(event, lockAction))
            .then((original) => (
                dispatch(main.saveAndUnlockItem(original, updates, true))
                    .then((item) => {
                        notify.success(successNotification);
                        return Promise.resolve(item);
                    }, (error) => {
                        notify.error(
                            getErrorMessage(
                                error,
                                failureNotification
                            )
                        );

                        return Promise.reject(error);
                    })
            ), (error) => {
                notify.error(
                    getErrorMessage(
                        error,
                        gettext('Could not obtain lock on the event.')
                    )
                );
                return Promise.reject(error);
            });
    }
);

/**
 * Action dispatcher that attempts to assign a calendar to an event
 * @param {object} event - The Event to asssign the agenda
 * @param {object} calendar - Calendar to be assigned
 * @return Promise
 */
const assignToCalendar = (event, calendar) => (
    (dispatch, getState, {notify}) => {
        const updates = {
            _id: event._id,
            type: event.type,
            calendars: [...get(event, 'calendars', []), calendar],
            _calendar: calendar,
        };

        return dispatch(lockAndSaveUpdates(
            event,
            updates,
            EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.lock_action,
            gettext('Calendar assigned to the event'),
            gettext('Failed to add Calendar to the Event'),
            self.openAssignCalendarModal)
        );
    }
);

const save = (original, updates, confirmation, unlockOnClose) => (
    (dispatch) => {
        if (confirmation &&
            (get(original, 'recurrence_id') || getPostedState(updates) === POST_STATE.CANCELLED)
        ) {
            // We are saving and unposting - may need to ask confirmation
            return dispatch(self.openEventPostModal(
                original,
                updates,
                updates._post,
                eventsApi.save,
                {
                    actionType: 'save',
                    unlockOnClose: unlockOnClose,
                }
            ));
        }

        return dispatch(eventsApi.save(original, updates));
    }
);

const creatAndOpenPlanning = (item, planningDate = null, openPlanningItem = false, agendas = null) => (
    (dispatch) => (
        dispatch(main.openActionModalFromEditor(
            item,
            gettext('Save changes before creating a planning item ?'),
            (unlockedItem, previousLock, openInEditor, openInModal) => (
                dispatch(addEventToCurrentAgenda(unlockedItem, planningDate, openPlanningItem, agendas, openInModal))
                    .then(() => {
                        if (!openPlanningItem &&
                                get(previousLock, 'action') === EVENTS.ITEM_ACTIONS.EDIT_EVENT.lock_action) {
                            return dispatch(main.openForEdit(unlockedItem, !openInModal, openInModal));
                        }
                    })
            )
        ))
    )
);

const onMarkEventCompleted = (event, editor = false) => (
    (dispatch, getState, {notify}) => {
        let updates = {
            _id: event._id,
            type: event.type,
            actioned_date: timeUtils.getDateInRemoteTimeZone(moment().startOf('day'), get(event, 'dates.tz')),
            completed: true,
        };

        if (event.recurrence_id) {
            // 'all': to make sure if we select a future event and action on it, logic should still apply to events
            // falling on the current day and ahead (not future and ahead) - determine which events in backend.
            updates.update_method = {value: 'all'};
        }

        if (editor) {
            return dispatch(main.openActionModalFromEditor(
                event,
                gettext('Save changes before marking event as complete ?'),
                (unlockedItem, previousLock, openInEditor, openInModal) => (
                    dispatch(locks.lock(unlockedItem, EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.lock_action))
                        .then((lockedItem) => (
                            dispatch(showModal({
                                modalType: MODALS.CONFIRMATION,
                                modalProps: {
                                    body: gettext('Are you sure you want to mark this event as complete?'),
                                    action: () =>
                                        dispatch(main.saveAndUnlockItem(lockedItem, updates, true)).then((result) => {
                                            if (get(previousLock, 'action') && (openInEditor || openInModal)) {
                                                dispatch(main.openForEdit(result, true, openInModal));
                                                dispatch(locks.lock(result, previousLock.action));
                                            }
                                        }, (error) => {
                                            dispatch(locks.unlock(lockedItem));
                                        }),
                                    onCancel: () => dispatch(locks.unlock(lockedItem)).then((result) => {
                                        if (get(previousLock, 'action') && (openInEditor || openInModal)) {
                                            dispatch(main.openForEdit(result, true, openInModal));
                                            dispatch(locks.lock(result, previousLock.action));
                                        }
                                    }),
                                    autoClose: true,
                                },
                            }))), (error) => {
                            notify.error(getErrorMessage(error, gettext('Could not obtain lock on the event.')));
                        }
                        ))));
        }

        // If actioned on list / preview
        return dispatch(locks.lock(event, EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.lock_action))
            .then((original) => (
                dispatch(showModal({
                    modalType: MODALS.CONFIRMATION,
                    modalProps: {
                        body: gettext('Are you sure you want to mark this event as complete?'),
                        action: () => dispatch(main.saveAndUnlockItem(original, updates, true)).catch((error) => {
                            dispatch(locks.unlock(original));
                        }),
                        onCancel: () => dispatch(locks.unlock(original)),
                        autoClose: true,
                    },
                }))), (error) => {
                notify.error(getErrorMessage(error, gettext('Could not obtain lock on the event.')));
            });
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
    _openActionModalFromEditor,
    onEventEditUnlock,
    assignToCalendar,
    openEventPostModal,
    save,
    openAssignCalendarModal,
    creatAndOpenPlanning,
    onMarkEventCompleted,
};

export default self;
