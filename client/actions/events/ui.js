"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
var appConfig_1 = require("appConfig");
var index_1 = require("../index");
var constants_1 = require("../../constants");
var api_1 = __importDefault(require("./api"));
var api_2 = __importDefault(require("../planning/api"));
var selectors = __importStar(require("../../selectors"));
var utils_1 = require("../../utils");
/**
 * Action Dispatcher to fetch events from the server
 * This will add the events to the events list,
 * and update the URL for deep linking
 * @param {object} params - Query parameters to send to the server
 * @return arrow function
 */
var fetchEvents = function (params) {
    if (params === void 0) { params = {
        spikeState: constants_1.SPIKED_STATE.NOT_SPIKED,
        page: 1,
    }; }
    return (function (dispatch, getState, _a) {
        var $timeout = _a.$timeout, $location = _a.$location;
        var filters = __assign(__assign({}, selectors.events.getEventFilterParams(getState())), params);
        dispatch(self.requestEvents(filters));
        return dispatch(api_1.default.query(filters, true))
            .then(function (items) {
            dispatch(api_1.default.receiveEvents(items));
            dispatch(self.setEventsList(items.map(function (e) { return e._id; })));
            // update the url (deep linking)
            $timeout(function () { return $location.search('searchParams', JSON.stringify(params)); });
            return items;
        });
    });
};
/**
 * Spike an event and notify the user of the result
 * @param {object} event - The event to spike
 */
var spike = function (item) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    return (dispatch(api_1.default.spike(item))
        .then(function (events) {
        notify.success(utils_1.gettext('The event(s) have been spiked'));
        dispatch(index_1.main.closePreviewAndEditorForItems(events));
        return Promise.resolve(events);
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Failed to spike the event(s)')));
        return Promise.reject(error);
    }));
}); };
var unspike = function (event) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    return (dispatch(api_1.default.unspike(event))
        .then(function (events) {
        notify.success(utils_1.gettext('The event(s) have been unspiked'));
        dispatch(index_1.main.closePreviewAndEditorForItems(events));
        return Promise.resolve(events);
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Failed to spike the event(s)')));
        return Promise.reject(error);
    }));
}); };
/**
 * Action Dispatcher to re-fetch the current list of events.
 */
var refetch = function (skipEvents) {
    if (skipEvents === void 0) { skipEvents = []; }
    return (function (dispatch, getState, _a) {
        var notify = _a.notify;
        if (!selectors.main.isEventsView(getState())) {
            return Promise.resolve([]);
        }
        return dispatch(api_1.default.refetch(skipEvents))
            .then(function (events) {
            dispatch(self.setEventsList(events.map(function (e) { return (e._id); })));
            return Promise.resolve(events);
        }, function (error) {
            notify.error(utils_1.getErrorMessage(error, 'Failed to refetch events'));
            return Promise.reject(error);
        });
    });
};
/**
 * Schedule the refetch to run after one second and avoid any other refetch
 */
var nextRefetch = {
    called: 0,
};
var scheduleRefetch = function (skipEvents) {
    if (skipEvents === void 0) { skipEvents = []; }
    return (function (dispatch) { return (dispatch(utils_1.dispatchUtils.scheduleDispatch(self.refetch(skipEvents), nextRefetch))); });
};
var cancelEvent = function (original, updates) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    return (dispatch(api_1.default.cancelEvent(original, updates))
        .then(function () {
        notify.success(utils_1.gettext('Event has been cancelled'));
        return dispatch(index_1.main.closePreviewAndEditorForItems([original]));
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Failed to cancel the Event!')));
        return Promise.reject(error);
    }));
}); };
var postponeEvent = function (original, updates) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    return (dispatch(api_1.default.postponeEvent(original, updates))
        .then(function (updatedEvent) {
        notify.success(utils_1.gettext('Event has been postponed'));
        return Promise.resolve(updatedEvent);
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Failed to postpone the Event!')));
        return Promise.reject(error);
    }));
}); };
var openSpikeModal = function (event, post, modalProps) {
    if (post === void 0) { post = false; }
    if (modalProps === void 0) { modalProps = {}; }
    return (function (dispatch) { return (dispatch(api_1.default.loadEventDataForAction(event, true, post, true, true)).then(function (eventWithData) {
        dispatch(self._openActionModal(eventWithData, {}, constants_1.EVENTS.ITEM_ACTIONS.SPIKE.label, null, true, post, false, true, modalProps));
    })); });
};
var openUnspikeModal = function (event, post) {
    if (post === void 0) { post = false; }
    return (function (dispatch) { return dispatch(self._openActionModal(event, {}, constants_1.EVENTS.ITEM_ACTIONS.UNSPIKE.label, null, true, post)); });
};
var openUpdateTimeModal = function (event, post, fromEditor) {
    if (post === void 0) { post = false; }
    if (fromEditor === void 0) { fromEditor = true; }
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: constants_1.EVENTS.ITEM_ACTIONS.UPDATE_TIME,
            title: utils_1.gettext('Save changes before updating the Event\'s time?'),
            loadPlannings: false,
            post: post,
            large: false,
            loadEvents: true,
        });
    }
    else {
        return self._openActionModal(event, {}, constants_1.EVENTS.ITEM_ACTIONS.UPDATE_TIME.label, null, true, post);
    }
};
var openCancelModal = function (event, post, fromEditor) {
    if (post === void 0) { post = false; }
    if (fromEditor === void 0) { fromEditor = true; }
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: constants_1.EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
            title: utils_1.gettext('Save changes before cancelling the Event?'),
            loadPlannings: true,
            post: post,
            large: true,
            loadEvents: true,
            refetchBeforeFinalLock: true,
        });
    }
    else {
        return self._openActionModal(event, {}, constants_1.EVENTS.ITEM_ACTIONS.CANCEL_EVENT.label, null, true, post);
    }
};
var openPostponeModal = function (event, post, fromEditor) {
    if (post === void 0) { post = false; }
    if (fromEditor === void 0) { fromEditor = true; }
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: constants_1.EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
            title: utils_1.gettext('Save changes before postponing the Event?'),
            loadPlannings: true,
            post: post,
            large: false,
            loadEvents: false,
        });
    }
    else {
        return self._openActionModal(event, {}, constants_1.EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.label, null, true, post);
    }
};
var openRescheduleModal = function (event, post, fromEditor) {
    if (post === void 0) { post = false; }
    if (fromEditor === void 0) { fromEditor = true; }
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: constants_1.EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
            title: utils_1.gettext('Save changes before rescheduling the Event?'),
            loadPlannings: true,
            post: post,
            large: true,
            loadEvents: false,
        });
    }
    else {
        return self._openActionModal(event, {}, constants_1.EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.label, null, true, post);
    }
};
var convertToRecurringEvent = function (event, post) { return (function (dispatch) { return dispatch(self._openActionModal(event, {}, constants_1.EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.label, constants_1.EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.lock_action, false, post, true)); }); };
var openRepetitionsModal = function (event, fromEditor) {
    if (fromEditor === void 0) { fromEditor = true; }
    if (fromEditor) {
        return self._openActionModalFromEditor({
            event: event,
            action: constants_1.EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS,
            title: utils_1.gettext('Save changes before updating Event Repetitions?'),
            refetchBeforeFinalLock: true,
        });
    }
    else {
        return self._openActionModal(event, {}, constants_1.EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.label, constants_1.EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.lock_action);
    }
};
var rescheduleEvent = function (original, updates) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    return (dispatch(api_1.default.rescheduleEvent(original, updates))
        .then(function (updatedEvent) {
        notify.success(utils_1.gettext('Event has been rescheduled'));
        var duplicatedEvent = lodash_1.get(updatedEvent, 'reschedule_to');
        var openEditor = function (item) {
            var itemId = utils_1.getItemId(item);
            var editorItemId = selectors.forms.currentItemId(getState());
            var editorModalItemId = selectors.forms.currentItemIdModal(getState());
            if (editorItemId === itemId || editorModalItemId === itemId) {
                dispatch(index_1.main.changeEditorAction('edit', editorModalItemId === itemId));
            }
            else {
                dispatch(index_1.main.openForEdit(item));
            }
        };
        if (utils_1.isItemRescheduled(updatedEvent) && duplicatedEvent) {
            return dispatch(api_1.default.fetchById(duplicatedEvent))
                .then(function (newEvent) {
                openEditor(newEvent);
                return Promise.resolve(newEvent);
            }, function (error) {
                notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Failed to load duplicated Event.')));
                return Promise.reject(error);
            });
        }
        openEditor(updatedEvent);
        return Promise.resolve(updatedEvent);
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Failed to reschedule the Event!')));
        return Promise.reject(error);
    }));
}); };
var _openActionModalFromEditor = function (_a) {
    var _b = _a === void 0 ? {} : _a, event = _b.event, action = _b.action, title = _b.title, _c = _b.loadPlannings, loadPlannings = _c === void 0 ? false : _c, _d = _b.post, post = _d === void 0 ? false : _d, _e = _b.large, large = _e === void 0 ? false : _e, _f = _b.loadEvents, loadEvents = _f === void 0 ? true : _f, _g = _b.refetchBeforeFinalLock, refetchBeforeFinalLock = _g === void 0 ? false : _g, _h = _b.modalProps, modalProps = _h === void 0 ? {} : _h;
    return (function (dispatch) { return (dispatch(index_1.main.openActionModalFromEditor(event, title, function (original, previousLock, openInEditor, openInModal) { return (dispatch(self._openActionModal(original, {}, action.label, action.lock_action, loadPlannings, post, large, loadEvents, __assign({ onCloseModal: function (savedItem) {
            var modifiedEvent = utils_1.eventUtils.modifyForClient(savedItem);
            var promise = refetchBeforeFinalLock ?
                dispatch(api_1.default.fetchById(modifiedEvent._id, { force: true })) :
                Promise.resolve(modifiedEvent);
            if (lodash_1.get(previousLock, 'action')) {
                promise.then(function (refetchedEvent) { return ((openInEditor || openInModal) ?
                    dispatch(index_1.main.openForEdit(refetchedEvent, !openInModal, openInModal)) :
                    dispatch(index_1.locks.lock(refetchedEvent, previousLock.action))); }, function () { return Promise.reject(); });
            }
            return promise;
        } }, modalProps)))); }))); });
};
var _openActionModal = function (original, updates, action, lockAction, loadPlannings, post, large, loadEvents, modalProps) {
    if (lockAction === void 0) { lockAction = null; }
    if (loadPlannings === void 0) { loadPlannings = false; }
    if (post === void 0) { post = false; }
    if (large === void 0) { large = false; }
    if (loadEvents === void 0) { loadEvents = true; }
    if (modalProps === void 0) { modalProps = {}; }
    return (function (dispatch, getState, _a) {
        var notify = _a.notify;
        return (dispatch(api_1.default.lock(original, lockAction))
            .then(function (lockedEvent) { return (dispatch(api_1.default.loadEventDataForAction(lockedEvent, loadPlannings, post, loadEvents))
            .then(function (eventDetail) { return (dispatch(index_1.showModal({
            modalType: constants_1.MODALS.ITEM_ACTIONS_MODAL,
            modalProps: __assign({ original: eventDetail, updates: updates, actionType: action, large: large }, modalProps),
        }))); }, function (error) {
            notify.error(utils_1.getErrorMessage(error, 'Failed to load associated Events'));
            return Promise.reject(error);
        })); }, function (error) {
            notify.error(utils_1.getErrorMessage(error, 'Failed to obtain the Event lock'));
            return Promise.reject(error);
        }));
    });
};
var duplicate = function (event) { return (function (dispatch, getState) {
    // If the event has files, get its entire file resource
    // To show in the edit form during duplication
    if (utils_1.eventUtils.shouldFetchFilesForEvent(event)) {
        dispatch(api_1.default.fetchEventFiles(event, false));
    }
    var occurStatuses = selectors.vocabs.eventOccurStatuses(getState());
    var plannedStatus = utils_1.getItemInArrayById(occurStatuses, 'eocstat:eos5', 'qcode') || {
        label: 'Planned, occurs certainly',
        qcode: 'eocstat:eos5',
        name: 'Planned, occurs certainly',
    };
    var newEvent = utils_1.eventUtils.modifyForClient(utils_1.eventUtils.duplicateEvent(event, plannedStatus));
    return dispatch(index_1.main.createNew(constants_1.ITEM_TYPE.EVENT, newEvent, true, selectors.forms.currentItemIdModal(getState())));
}); };
var updateEventTime = function (original, updates) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    return (dispatch(api_1.default.updateEventTime(original, updates))
        .then(function (updatedEvent) {
        notify.success(utils_1.gettext('Event time has been updated'));
        return Promise.resolve(updatedEvent);
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Failed to update the Event time!')));
        return Promise.reject(error);
    }));
}); };
var updateRepetitions = function (original, updates) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    return (dispatch(api_1.default.updateRepetitions(original, updates))
        .then(function (updatedEvent) {
        notify.success(utils_1.gettext('Event repetitions updated'));
        return Promise.resolve(updatedEvent);
    }, function (error) {
        notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Failed to update Event repetitions')));
        return Promise.reject(error);
    }));
}); };
var saveWithConfirmation = function (original, updates, unlockOnClose, ignoreRecurring) {
    if (ignoreRecurring === void 0) { ignoreRecurring = false; }
    return (function (dispatch) {
        // If this is not from a recurring series, then simply post this event
        // Do the same if we need to ignore recurring event selection on purpose
        if (!lodash_1.get(original, 'recurrence_id') || ignoreRecurring) {
            return dispatch(api_1.default.save(original, updates));
        }
        return dispatch(api_1.default.query({
            recurrenceId: original.recurrence_id,
            maxResults: appConfig_1.appConfig.max_recurrent_events,
            onlyFuture: false,
        }))
            .then(function (relatedEvents) { return (dispatch(index_1.showModal({
            modalType: constants_1.MODALS.ITEM_ACTIONS_MODAL,
            modalProps: {
                original: __assign(__assign({}, original), { _recurring: relatedEvents || [original], _events: [], _originalEvent: original }),
                updates: updates,
                actionType: 'save',
                unlockOnClose: unlockOnClose,
            },
        }))); });
    });
};
var postWithConfirmation = function (original, updates, post) { return (function (dispatch) {
    // If this is not from a recurring series, then simply post this event
    var hasPlannings = utils_1.eventUtils.eventHasPlanning(original);
    if (!lodash_1.get(original, 'recurrence_id') && !hasPlannings) {
        return dispatch(post ?
            api_1.default.post(original, updates) :
            api_1.default.unpost(original, updates));
    }
    return dispatch(self.openEventPostModal(original, updates, post));
}); };
var openEventPostModal = function (original, updates, post, unpostAction, modalProps, planningItem, planningAction) {
    if (modalProps === void 0) { modalProps = {}; }
    if (planningItem === void 0) { planningItem = null; }
    if (planningAction === void 0) { planningAction = null; }
    return (function (dispatch) {
        var promise = Promise.resolve(original);
        if (planningItem) {
            // Actually posting a planning item
            if (!planningItem.event_item || !planningItem.recurrence_id) {
                // Adhoc planning item or does not belong to recurring series
                return dispatch(planningAction()).then(function (p) { return Promise.resolve(p); });
            }
            promise = dispatch(api_1.default.fetchById(planningItem.event_item, { force: true, loadPlanning: false }));
        }
        return promise.then(function (fetchedEvent) {
            if (planningItem && utils_1.isItemPublic(fetchedEvent)) {
                return dispatch(planningAction()).then(function (p) { return Promise.resolve(p); });
            }
            return dispatch(api_1.default.loadEventDataForAction(fetchedEvent, true, post, true, true)).then(function (eventWithData) {
                if (!post &&
                    !eventWithData.recurrence_id &&
                    !utils_1.eventUtils.eventHasPostedPlannings(eventWithData)) {
                    // Not a recurring event and has no posted planning items to confirm unpost
                    // Just unpost
                    return dispatch(!unpostAction ?
                        api_1.default.unpost(fetchedEvent, updates) :
                        unpostAction(fetchedEvent, updates));
                }
                return new Promise(function (resolve, reject) {
                    dispatch(index_1.showModal({
                        modalType: constants_1.MODALS.ITEM_ACTIONS_MODAL,
                        modalProps: __assign({ resolve: resolve, reject: reject, original: eventWithData, updates: updates, actionType: modalProps.actionType ?
                                modalProps.actionType :
                                constants_1.EVENTS.ITEM_ACTIONS.POST_EVENT.label, planningItem: planningItem, planningAction: planningAction }, modalProps),
                    }));
                }).then(function (rtn) { return Promise.resolve(rtn); });
            });
        });
    });
};
var openAssignCalendarModal = function (original, updates) { return (function (dispatch) { return dispatch(self._openActionModal(original, updates, constants_1.EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.label, 'assign_calendar', false, false, false, true, {})); }); };
/**
 * Action to load more events
 */
var loadMore = function () { return function (dispatch, getState) {
    var previousParams = selectors.main.lastRequestParams(getState());
    var totalItems = selectors.main.eventsTotalItems(getState());
    var eventIdsInList = selectors.events.eventIdsInList(getState());
    if (totalItems === lodash_1.get(eventIdsInList, 'length', 0)) {
        return Promise.resolve();
    }
    var params = __assign(__assign({}, previousParams), { page: lodash_1.get(previousParams, 'page', 1) + 1 });
    return dispatch(api_1.default.query(params, true))
        .then(function (items) {
        if (lodash_1.get(items, 'length', 0) === constants_1.MAIN.PAGE_SIZE) {
            dispatch(self.requestEvents(params));
        }
        dispatch(api_1.default.receiveEvents(items));
        dispatch(self.addToList(items.map(function (e) { return e._id; })));
    });
}; };
var requestEvents = function (params) {
    var _a;
    if (params === void 0) { params = {}; }
    return ({
        type: constants_1.MAIN.ACTIONS.REQUEST,
        payload: (_a = {}, _a[constants_1.MAIN.FILTERS.EVENTS] = params, _a),
    });
};
/**
 * Action to set the list of events in the current list
 * @param {Array} idsList - An array of Event IDs to assign to the current list
 * @return object
 */
var setEventsList = function (idsList) { return ({
    type: constants_1.EVENTS.ACTIONS.SET_EVENTS_LIST,
    payload: idsList,
}); };
/**
 * Clears the Events List
 */
var clearList = function () { return ({ type: constants_1.EVENTS.ACTIONS.CLEAR_LIST }); };
/**
 * Action to add events to the current list
 * This action makes sure the list of events are unique, no duplicates
 * @param {array} eventsIds - An array of Event IDs to add
 * @return {{type: string, payload: *}}
 */
var addToList = function (eventsIds) { return ({
    type: constants_1.EVENTS.ACTIONS.ADD_TO_EVENTS_LIST,
    payload: eventsIds,
}); };
/**
 * Action to receive the history of actions on Event and store them in the store
 * @param {array} eventHistoryItems - An array of Event History items
 * @return object
 */
var receiveEventHistory = function (eventHistoryItems) { return ({
    type: constants_1.EVENTS.ACTIONS.RECEIVE_EVENT_HISTORY,
    payload: eventHistoryItems,
}); };
/**
 * Action to create a new Event from an existing Planning item
 * @param {IPlanningItem} plan - The Planning item to creat the Event from
 */
var createEventFromPlanning = function (plan) { return (function (dispatch, getState) {
    var defaultDurationOnChange = selectors.forms.defaultEventDuration(getState());
    var occurStatuses = selectors.vocabs.eventOccurStatuses(getState());
    var unplannedStatus = utils_1.getItemInArrayById(occurStatuses, 'eocstat:eos0', 'qcode') || {
        label: 'Unplanned event',
        qcode: 'eocstat:eos0',
        name: 'Unplanned event',
    };
    var eventProfile = selectors.forms.eventProfile(getState());
    var newEvent = {
        dates: {
            start: moment_timezone_1.default(plan.planning_date).clone(),
            end: moment_timezone_1.default(plan.planning_date)
                .clone()
                .add(defaultDurationOnChange, 'h'),
            tz: moment_timezone_1.default.tz.guess(),
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
    if (lodash_1.get(eventProfile, 'editor.slugline.enabled', false)) {
        newEvent.slugline = plan.slugline;
    }
    return Promise.all([
        dispatch(api_2.default.lock(plan, 'add_as_event')),
        dispatch(index_1.main.createNew(constants_1.ITEM_TYPE.EVENT, newEvent)),
    ]);
}); };
/**
 * Action to select a specific Calendar and fetch the Events that satisfy the filter params as well.
 * @param {string} calendarId - The Calendar ID to select, defaults to 'All Calendars'
 * @param {object} params - The filter parameters
 */
var selectCalendar = function (calendarId, params) {
    if (calendarId === void 0) { calendarId = ''; }
    if (params === void 0) { params = {}; }
    return (function (dispatch, getState, _a) {
        var $timeout = _a.$timeout, $location = _a.$location;
        var defaultCalendar = selectors.events.defaultCalendarFilter(getState());
        var calendar = calendarId || lodash_1.get(defaultCalendar, 'qcode') || constants_1.EVENTS.FILTER.DEFAULT;
        dispatch({
            type: constants_1.EVENTS.ACTIONS.SELECT_CALENDAR,
            payload: calendar,
        });
        // Update the url
        $timeout(function () { return $location.search('calendar', calendar); });
        // Reload the Event list
        dispatch(index_1.main.setUnsetUserInitiatedSearch(true));
        return dispatch(self.fetchEvents(params))
            .then(function (data) { return Promise.resolve(data); })
            .finally(function () { return dispatch(index_1.main.setUnsetUserInitiatedSearch(false)); });
    });
};
var onEventEditUnlock = function (event) { return (function (dispatch) { return (lodash_1.get(event, '_planning_item') ? dispatch(api_2.default.unlock({ _id: event._planning_item })) :
    Promise.resolve()); }); };
var lockAndSaveUpdates = function (event, updates, lockAction, successNotification, failureNotification, recurringModalAction, openRecurringModal) {
    if (openRecurringModal === void 0) { openRecurringModal = true; }
    return (function (dispatch, getState, _a) {
        var notify = _a.notify;
        // If this is a recurring event, then open the modal
        // so the user can select which Events to action on
        // Note: Some actions don't need this if it is a recurring event
        // Eg. "Mark event as complete"
        if (lodash_1.get(event, 'recurrence_id') && openRecurringModal && recurringModalAction) {
            return dispatch(recurringModalAction(event, updates));
        }
        // Otherwise lock, save and unlock this Event
        return dispatch(index_1.locks.lock(event, lockAction))
            .then(function (original) { return (dispatch(index_1.main.saveAndUnlockItem(original, updates, true))
            .then(function (item) {
            notify.success(successNotification);
            return Promise.resolve(item);
        }, function (error) {
            notify.error(utils_1.getErrorMessage(error, failureNotification));
            return Promise.reject(error);
        })); }, function (error) {
            notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Could not obtain lock on the event.')));
            return Promise.reject(error);
        });
    });
};
/**
 * Action dispatcher that attempts to assign a calendar to an event
 * @param {object} event - The Event to asssign the agenda
 * @param {object} calendar - Calendar to be assigned
 * @return Promise
 */
var assignToCalendar = function (event, calendar) { return (function (dispatch, getState, _a) {
    var notify = _a.notify;
    var updates = {
        _id: event._id,
        type: event.type,
        calendars: __spreadArrays(lodash_1.get(event, 'calendars', []), [calendar]),
        _calendar: calendar,
    };
    return dispatch(lockAndSaveUpdates(event, updates, constants_1.EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.lock_action, utils_1.gettext('Calendar assigned to the event'), utils_1.gettext('Failed to add Calendar to the Event'), self.openAssignCalendarModal));
}); };
var save = function (original, updates, confirmation, unlockOnClose) { return (function (dispatch) {
    if (confirmation &&
        (lodash_1.get(original, 'recurrence_id') || utils_1.getPostedState(updates) === constants_1.POST_STATE.CANCELLED)) {
        // We are saving and unposting - may need to ask confirmation
        return dispatch(self.openEventPostModal(original, updates, updates._post, api_1.default.save, {
            actionType: 'save',
            unlockOnClose: unlockOnClose,
        }));
    }
    return dispatch(api_1.default.save(original, updates));
}); };
var creatAndOpenPlanning = function (item, planningDate, openPlanningItem, agendas) {
    if (planningDate === void 0) { planningDate = null; }
    if (openPlanningItem === void 0) { openPlanningItem = false; }
    if (agendas === void 0) { agendas = null; }
    return (function (dispatch) { return (dispatch(index_1.main.openActionModalFromEditor(item, utils_1.gettext('Save changes before creating a planning item ?'), function (unlockedItem, previousLock, openInEditor, openInModal) { return (dispatch(index_1.addEventToCurrentAgenda(unlockedItem, planningDate, openPlanningItem, agendas, openInModal))
        .then(function () {
        if (!openPlanningItem &&
            lodash_1.get(previousLock, 'action') === constants_1.EVENTS.ITEM_ACTIONS.EDIT_EVENT.lock_action) {
            return dispatch(index_1.main.openForEdit(unlockedItem, !openInModal, openInModal));
        }
    })); }))); });
};
var onMarkEventCompleted = function (event, editor) {
    if (editor === void 0) { editor = false; }
    return (function (dispatch, getState, _a) {
        var notify = _a.notify;
        var updates = {
            _id: event._id,
            type: event.type,
            actioned_date: utils_1.timeUtils.getDateInRemoteTimeZone(moment_timezone_1.default().startOf('day'), lodash_1.get(event, 'dates.tz')),
            completed: true,
        };
        if (event.recurrence_id) {
            // 'all': to make sure if we select a future event and action on it, logic should still apply to events
            // falling on the current day and ahead (not future and ahead) - determine which events in backend.
            updates.update_method = { value: 'all' };
        }
        if (editor) {
            return dispatch(index_1.main.openActionModalFromEditor(event, utils_1.gettext('Save changes before marking event as complete ?'), function (unlockedItem, previousLock, openInEditor, openInModal) { return (dispatch(index_1.locks.lock(unlockedItem, constants_1.EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.lock_action))
                .then(function (lockedItem) { return (dispatch(index_1.showModal({
                modalType: constants_1.MODALS.CONFIRMATION,
                modalProps: {
                    body: utils_1.gettext('Are you sure you want to mark this event as complete?'),
                    action: function () {
                        return dispatch(index_1.main.saveAndUnlockItem(lockedItem, updates, true)).then(function (result) {
                            if (lodash_1.get(previousLock, 'action') && (openInEditor || openInModal)) {
                                dispatch(index_1.main.openForEdit(result, true, openInModal));
                                dispatch(index_1.locks.lock(result, previousLock.action));
                            }
                        }, function (error) {
                            dispatch(index_1.locks.unlock(lockedItem));
                        });
                    },
                    onCancel: function () { return dispatch(index_1.locks.unlock(lockedItem)).then(function (result) {
                        if (lodash_1.get(previousLock, 'action') && (openInEditor || openInModal)) {
                            dispatch(index_1.main.openForEdit(result, true, openInModal));
                            dispatch(index_1.locks.lock(result, previousLock.action));
                        }
                    }); },
                    autoClose: true,
                },
            }))); }, function (error) {
                notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Could not obtain lock on the event.')));
            })); }));
        }
        // If actioned on list / preview
        return dispatch(index_1.locks.lock(event, constants_1.EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.lock_action))
            .then(function (original) { return (dispatch(index_1.showModal({
            modalType: constants_1.MODALS.CONFIRMATION,
            modalProps: {
                body: utils_1.gettext('Are you sure you want to mark this event as complete?'),
                action: function () { return dispatch(index_1.main.saveAndUnlockItem(original, updates, true)).catch(function (error) {
                    dispatch(index_1.locks.unlock(original));
                }); },
                onCancel: function () { return dispatch(index_1.locks.unlock(original)); },
                autoClose: true,
            },
        }))); }, function (error) {
            notify.error(utils_1.getErrorMessage(error, utils_1.gettext('Could not obtain lock on the event.')));
        });
    });
};
// eslint-disable-next-line consistent-this
var self = {
    fetchEvents: fetchEvents,
    spike: spike,
    unspike: unspike,
    refetch: refetch,
    scheduleRefetch: scheduleRefetch,
    setEventsList: setEventsList,
    clearList: clearList,
    openSpikeModal: openSpikeModal,
    openUnspikeModal: openUnspikeModal,
    cancelEvent: cancelEvent,
    openCancelModal: openCancelModal,
    openUpdateTimeModal: openUpdateTimeModal,
    openRescheduleModal: openRescheduleModal,
    rescheduleEvent: rescheduleEvent,
    postponeEvent: postponeEvent,
    openPostponeModal: openPostponeModal,
    _openActionModal: _openActionModal,
    convertToRecurringEvent: convertToRecurringEvent,
    saveWithConfirmation: saveWithConfirmation,
    receiveEventHistory: receiveEventHistory,
    loadMore: loadMore,
    addToList: addToList,
    requestEvents: requestEvents,
    updateEventTime: updateEventTime,
    duplicate: duplicate,
    updateRepetitions: updateRepetitions,
    openRepetitionsModal: openRepetitionsModal,
    postWithConfirmation: postWithConfirmation,
    createEventFromPlanning: createEventFromPlanning,
    selectCalendar: selectCalendar,
    _openActionModalFromEditor: _openActionModalFromEditor,
    onEventEditUnlock: onEventEditUnlock,
    assignToCalendar: assignToCalendar,
    openEventPostModal: openEventPostModal,
    save: save,
    openAssignCalendarModal: openAssignCalendarModal,
    creatAndOpenPlanning: creatAndOpenPlanning,
    onMarkEventCompleted: onMarkEventCompleted,
};
exports.default = self;
//# sourceMappingURL=ui.js.map