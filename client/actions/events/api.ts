import {get, isEqual, cloneDeep, pickBy, has, find, every} from 'lodash';
import moment from 'moment';

import {ISearchSpikeState, IEventSearchParams, IEventItem, IPlanningItem} from '../../interfaces';
import {appConfig} from 'appConfig';
import {planningApis} from '../../api';

import {
    EVENTS,
    SPIKED_STATE,
    POST_STATE,
    MAIN,
    TO_BE_CONFIRMED_FIELD,
} from '../../constants';
import {EventUpdateMethods} from '../../components/Events';
import * as selectors from '../../selectors';
import {
    eventUtils,
    lockUtils,
    getErrorMessage,
    isExistingItem,
    isValidFileInput,
    isPublishedItemId,
    isTemporaryId,
    gettext,
    getTimeZoneOffset,
} from '../../utils';

import planningApi from '../planning/api';
import eventsUi from './ui';
import main from '../main';

/**
 * Action dispatcher to load a series of recurring events into the local store.
 * This does not update the list of visible Events
 * @param {string} rid
 * @param {string} spikeState
 * @param {int} page - The page number to fetch
 * @param {int} maxResults - The number to events per page
 * @param {boolean} loadToStore - To load events into store
 */
const loadEventsByRecurrenceId = (
    rid: string,
    spikeState: ISearchSpikeState = 'both',
    page: number = 1,
    maxResults: number = 25,
    loadToStore: boolean = true
) => (
    (dispatch) => (
        planningApis.events.search({
            recurrence_id: rid,
            spike_state: spikeState,
            page: page,
            max_results: maxResults,
            only_future: false,
            include_killed: true,
        })
            .then((items) => {
                if (loadToStore) {
                    dispatch(self.receiveEvents(items));
                }

                return Promise.resolve(items);
            }, (error) => (
                Promise.reject(error)
            ))
    )
);

/**
 * Action dispatcher to mark an Event as spiked using the API.
 * @param {Array} events - An Array of Events to be spiked
 */
const spike = (events) => (
    (dispatch, getState, {api}) => {
        let eventsToSpike = (Array.isArray(events) ? events : [events]);

        return Promise.all(
            eventsToSpike.map((event) => {
                event.update_method = get(event, 'update_method.value', EventUpdateMethods[0].value);
                return api.update(
                    'events_spike',
                    event,
                    {update_method: event.update_method}
                );
            })
        )
            .then(
                () => Promise.resolve(eventsToSpike),
                (error) => (Promise.reject(error))
            );
    }
);

const unspike = (events) => (
    (dispatch, getState, {api}) => {
        let eventsToUnspike = (Array.isArray(events) ? events : [events]);

        return Promise.all(
            eventsToUnspike.map((event) => {
                event.update_method = get(event, 'update_method.value', EventUpdateMethods[0].value);
                return api.update(
                    'events_unspike',
                    event,
                    {update_method: event.update_method}
                );
            })
        )
            .then(
                () => Promise.resolve(eventsToUnspike),
                (error) => (Promise.reject(error))
            );
    }
);

/**
 * Action Dispatcher for query the api for events
 * You can provide one of the following parameters to fetch from the server
 * @param {Array} calendars - List of Calendars to filter
 * @param {boolean} noCalendarAssigned - Search for Events that have no Calendar assigned
 * @param {object} advancedSearch - Query parameters to send to the server
 * @param {object} fulltext - Full text search parameters
 * @param {Array} ids - An array of Event IDs to fetch
 * @param {string} recurrenceId - The recurrence_id to fetch recurring events
 * @param {string} spikeState - The item state to filter by
 * @param {boolean} onlyFuture - Get future events. Onlyfuture is ignored if advancedSearch.dates specified.
 * @param {int} page - The page number to fetch
 * @param {int} maxResults - The number to events per page
 * @param {boolean} includeKilled - If true, includes killed items
 * @param {boolean} storeTotal - True to store total in the store
 * @return arrow function
 */
function query(
    {
        calendars,
        noCalendarAssigned = false,
        advancedSearch = {},
        fulltext,
        ids,
        recurrenceId,
        spikeState = 'draft',
        onlyFuture = true,
        page = 1,
        maxResults = MAIN.PAGE_SIZE,
        includeKilled = false,
    }: IEventSearchParams,
    storeTotal = false
) {
    return (dispatch) => {
        let itemIds = [];

        if (ids) {
            const chunkSize = EVENTS.FETCH_IDS_CHUNK_SIZE;

            if (ids.length <= chunkSize) {
                itemIds = ids;
            } else {
                // chunk the requests
                const requests = [];

                for (let i = 0; i < Math.ceil(ids.length / chunkSize); i++) {
                    const args = {
                        // eslint-disable-next-line no-undef
                        ...arguments[0],
                        ids: ids.slice(i * chunkSize, (i + 1) * chunkSize),
                    };

                    requests.push(dispatch(self.query(args)));
                }
                // flattern responses and return a response-like object
                return Promise.all(requests).then((responses) => (
                    Array.prototype.concat.apply([], responses)
                ));
            }
        }

        return planningApis.events.search({
            item_ids: itemIds,
            name: advancedSearch?.name,
            tz_offset: getTimeZoneOffset(),
            full_text: fulltext,
            anpa_category: advancedSearch.anpa_category,
            subject: advancedSearch.subject,
            posted: advancedSearch.posted,
            place: advancedSearch.place,
            language: advancedSearch.language,
            state: advancedSearch.state,
            spike_state: spikeState,
            include_killed: includeKilled,
            date_filter: advancedSearch?.dates?.range,
            start_date: advancedSearch?.dates?.start,
            end_date: advancedSearch?.dates?.end,
            start_of_week: appConfig.start_of_week,
            slugline: advancedSearch?.slugline,
            recurrence_id: recurrenceId,
            reference: advancedSearch?.reference,
            source: advancedSearch?.source,
            location: typeof advancedSearch.location === 'string' ?
                advancedSearch.location :
                advancedSearch.location?.name,
            calendars: calendars,
            no_calendar_assigned: noCalendarAssigned,
            only_future: onlyFuture,
            page: page,
            max_results: maxResults,
        })
            .then((response) => {
                if (storeTotal) {
                    dispatch(main.setTotal(MAIN.FILTERS.EVENTS, response._meta?.total ?? 0));
                }

                return response._items;
            }, (error) => Promise.reject(error));
    };
}

/**
 * Action Dispatcher to re-fetch the current list of events
 * It achieves this by performing a fetch using the params from
 * the store value `events.lastRequestParams`
 */
const refetch = (skipEvents = []) => (
    (dispatch, getState) => {
        const prevParams = selectors.main.lastRequestParams(getState());
        const promises = [];

        for (let i = 1; i <= prevParams.page; i++) {
            const params = {
                ...prevParams,
                page: i,
            };

            dispatch(eventsUi.requestEvents(params));
            promises.push(dispatch(self.query(params, true)));
        }

        return Promise.all(promises)
            .then((responses) => {
                let events = Array.prototype.concat.apply([], responses);

                dispatch(self.receiveEvents(events, skipEvents));
                return Promise.resolve(events);
            }, (error) => (Promise.reject(error)));
    }
);

function loadEventDataForAction(
    event: IEventItem,
    loadPlanning: boolean = true,
    post: boolean = false,
    loadEvents: boolean = true,
    loadEveryRecurringPlanning: boolean = false
): Promise<IEventItem & {
    _recurring: Array<IEventItem>;
    _post: boolean;
    _events: Array<IEventItem>;
    _originalEvent: IEventItem;
    _plannings: Array<IPlanningItem>;
    _relatedPlannings: Array<IPlanningItem>;
}> {
    return planningApis.combined.getRecurringEventsAndPlanningItems(event, loadPlanning, loadEvents)
        .then((items) => ({
            ...event,
            _recurring: items.events,
            _post: post,
            _events: [],
            _originalEvent: event,
            _plannings: items.plannings,
            _relatedPlannings: loadEveryRecurringPlanning ?
                items.plannings :
                items.plannings.filter(
                    (item) => item.event_item === event._id
                ),
        }));
}

/**
 * Action dispatcher to load all Planning items associated with an Event
 * @param {object} event - The Event to load Planning items for
 * @return Array of Planning items loaded
 */
const loadAssociatedPlannings = (event) => (
    (dispatch) => {
        if (get(event, 'planning_ids.length', 0) === 0) {
            return Promise.resolve([]);
        }

        return dispatch(planningApi.loadPlanningByEventId(event._id));
    }
);

/**
 * Action dispatcher to get a single Event
 * If the Event is already stored in the Redux store, then return that
 * Otherwise fetch the Event from the server and optionally
 * save the Event in the Redux store
 * @param {string} eventId - The ID of the Event to retrieve
 * @param {boolean} saveToStore - If true, save the Event in the Redux store
 */
const getEvent = (eventId, saveToStore = true) => (
    (dispatch, getState) => {
        const events = selectors.events.storedEvents(getState());

        if (eventId in events) {
            return Promise.resolve(events[eventId]);
        }

        return dispatch(self.silentlyFetchEventsById(eventId, SPIKED_STATE.BOTH, saveToStore))
            .then((items) => (Promise.resolve({
                ...items[0],
                dates: {
                    ...items[0].dates,
                    start: moment(items[0].dates.start),
                    end: moment(items[0].dates.end),
                },
            })), (error) => Promise.reject(error));
    }
);

/**
 * Action to receive the list of Events and store them in the store
 * @param {Array} events - An array of Event items
 * @return object
 */
const receiveEvents = (events, skipEvents: Array<any> = []) => ({
    type: EVENTS.ACTIONS.ADD_EVENTS,
    payload: get(skipEvents, 'length', 0) > 0 ?
        events.filter((e) => !skipEvents.includes(e._id)) : events,
    receivedAt: Date.now(),
});

/**
 * Action to lock an Event
 * @param {Object} event - Event to be unlocked
 * @param {String} action - The lock action
 * @return Promise
 */
const lock = (event, action = 'edit') => (
    (dispatch, getState, {api, notify}) => {
        if (action === null ||
            lockUtils.isItemLockedInThisSession(
                event,
                selectors.general.session(getState()),
                selectors.locks.getLockedItems(getState())
            )
        ) {
            return Promise.resolve(event);
        }

        return api('events_lock', event).save({}, {lock_action: action})
            .then(
                (item) => {
                    // On lock, file object in the event is lost, so, replace it from original event
                    item.files = event.files;
                    eventUtils.modifyForClient(item);

                    dispatch({
                        type: EVENTS.ACTIONS.LOCK_EVENT,
                        payload: {event: item},
                    });

                    return Promise.resolve(item);
                }, (error) => {
                    const msg = get(error, 'data._message') || 'Could not lock the event.';

                    notify.error(msg);
                    if (error) throw error;
                });
    }
);

const unlock = (event) => (
    (dispatch, getState, {api, notify}) => (
        api('events_unlock', event).save({})
            .then(
                (item) => {
                    dispatch({
                        type: EVENTS.ACTIONS.UNLOCK_EVENT,
                        payload: {event: item},
                    });

                    return Promise.resolve(item);
                },
                (error) => {
                    notify.error(
                        getErrorMessage(error, 'Could not unlock the event')
                    );
                    return Promise.reject(error);
                }
            )
    )
);

/**
 * Action Dispatcher to fetch events from the server,
 * and add them to the store without adding them to the events list
 * @param {Array, string} ids - Either an array of Event IDs or a single Event ID to fetch
 * @param {string} spikeState - Event's spiked state (SPIKED, NOT_SPIKED or BOTH)
 * @param {boolean} saveToStore - If true, save the Event in the Redux store
 * @return arrow function
 */
const silentlyFetchEventsById = (ids, spikeState: ISearchSpikeState = 'draft', saveToStore = true) => (
    (dispatch) => (
        new Promise((resolve, reject) => {
            if (Array.isArray(ids)) {
                planningApis.events.search({
                    // distinct ids
                    item_ids: ids.filter((v, i, a) => (a.indexOf(v) === i)),
                    spike_state: spikeState,
                    only_future: false,
                })
                    .then(
                        (response) => resolve(response._items),
                        (error) => reject(error)
                    );
            } else {
                planningApis.events.getById(ids)
                    .then(
                        (item) => resolve([item]),
                        (error) => reject(error)
                    );
            }
        })
            .then((items) => {
                if (saveToStore) {
                    dispatch(self.receiveEvents(items));
                }

                return Promise.resolve(items);
            }, (error) => (
                Promise.reject(error)
            ))
    )
);

/**
 * Action Dispatcher to fetch a single event using its ID
 * and add or update the Event in the Redux Store
 * @param {string} eventId - The ID of the Event to fetch
 * @param {boolean} force - Force using the API instead of Redux store
 * @param {boolean} saveToStore - If true, save the Event item in the Redux store
 * @param {boolean} loadPlanning - If true, load associated Planning items as well
 */
const fetchById = (eventId, {force = false, saveToStore = true, loadPlanning = true} = {}) => (
    (dispatch, getState) => {
        // Test if the Event item is already loaded into the store
        // If so, return that instance instead
        const storedEvents = selectors.events.storedEvents(getState());
        let promise;

        if (isPublishedItemId(eventId)) {
            return Promise.resolve({});
        }

        if (has(storedEvents, eventId) && !force) {
            promise = Promise.resolve(storedEvents[eventId]);
        } else {
            promise = planningApis.events.getById(eventId)
                .then((event) => {
                    if (saveToStore) {
                        dispatch(self.receiveEvents([event]));
                    }

                    return Promise.resolve(event);
                }, (error) => Promise.reject(error));
        }

        return promise.then((event) => {
            if (loadPlanning) {
                return dispatch(self.loadAssociatedPlannings(event))
                    .then(
                        () => Promise.resolve(event),
                        (error) => Promise.reject(error)
                    );
            }

            return Promise.resolve(event);
        }, (error) => Promise.reject(error));
    }
);

const cancelEvent = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_cancel',
            original,
            {
                update_method: get(updates, 'update_method.value', EventUpdateMethods[0].value),
                reason: get(updates, 'reason', undefined),
            }
        )
    )
);

const rescheduleEvent = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_reschedule',
            original,
            {
                update_method: get(updates, 'update_method.value', EventUpdateMethods[0].value),
                dates: updates.dates,
                reason: get(updates, 'reason', null),
            }
        )
    )
);

const postponeEvent = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_postpone',
            original,
            {
                update_method: get(updates, 'update_method.value', EventUpdateMethods[0].value),
                reason: get(updates, 'reason', undefined),
            }
        )
    )
);

/**
 * Set event.pubstatus usable and post event.
 *
 * @param {Object} original - The original event item
 * @param {Object} updates - The updates to the item
 */
const post = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.save('events_post', {
            event: original._id,
            etag: original._etag,
            pubstatus: get(updates, 'pubstatus', POST_STATE.USABLE),
            update_method: get(updates, 'update_method.value', EventUpdateMethods[0].value),
        }).then(
            () => dispatch(self.fetchById(original._id, {force: true})),
            (error) => Promise.reject(error)
        )
    )
);

/**
 * Set event.pubstatus canceled and post event.
 *
 * @param {Object} original - The original event item
 * @param {Object} updates - The updates to the item
 */
const unpost = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.save('events_post', {
            event: original._id,
            etag: original._etag,
            pubstatus: get(updates, 'pubstatus', POST_STATE.CANCELLED),
            update_method: get(updates, 'update_method.value', EventUpdateMethods[0].value),
        }).then(
            () => dispatch(self.fetchById(original._id, {force: true})),
            (error) => Promise.reject(error)
        )
    )
);

const updateEventTime = (original, updates) => (
    (dispatch, getState, {api}) => {
        if (get(updates, TO_BE_CONFIRMED_FIELD)) {
            return dispatch(main.saveAndUnlockItem(original, {
                [TO_BE_CONFIRMED_FIELD]: true,
                update_method: get(updates, 'update_method'),
            }, true));
        }

        return api.update(
            'events_update_time',
            original,
            {
                update_method: get(updates, 'update_method.value', EventUpdateMethods[0].value),
                dates: updates.dates,
                [TO_BE_CONFIRMED_FIELD]: false,
            }
        );
    }
);

const markEventCancelled = (eventId, etag, reason, occurStatus, cancelledItems, actionedDate) => ({
    type: EVENTS.ACTIONS.MARK_EVENT_CANCELLED,
    payload: {
        event_id: eventId,
        etag: etag,
        reason: reason,
        occur_status: occurStatus,
        cancelled_items: cancelledItems,
        actionedDate: actionedDate,
    },
});

const markEventPostponed = (event, reason, actionedDate) => ({
    type: EVENTS.ACTIONS.MARK_EVENT_POSTPONED,
    payload: {
        event: event,
        reason: reason,
        actionedDate: actionedDate,
    },
});

const markEventHasPlannings = (event, planning) => ({
    type: EVENTS.ACTIONS.MARK_EVENT_HAS_PLANNINGS,
    payload: {
        event_item: event,
        planning_item: planning,
    },
});

/**
 * Action Dispatcher to fetch event history from the server
 * This will add the history of action on that event in event history list
 * @param {object} eventId - Query parameters to send to the server
 * @return arrow function
 */
const fetchEventHistory = (eventId) => (
    (dispatch, getState, {api}) => (
        // Query the API and sort by created
        api('events_history').query({
            where: {event_id: eventId},
            max_results: 200,
            sort: '[(\'_created\', 1)]',
        })
            .then((data) => (Promise.resolve(data._items))
            )
    ));

const uploadFiles = (event) => (
    (dispatch, getState, {upload}) => {
        const clonedEvent = cloneDeep(event);

        // If no files, do nothing
        if (get(clonedEvent, 'files.length', 0) === 0) {
            return Promise.resolve([]);
        }

        // Calculate the files to upload
        const filesToUpload = clonedEvent.files.filter(
            (f) => isValidFileInput(f)
        );

        if (filesToUpload.length < 1) {
            return Promise.resolve([]);
        }

        return Promise.all(filesToUpload.map((file) => (
            upload.start({
                method: 'POST',
                url: appConfig.server.url + '/events_files/',
                headers: {'Content-Type': 'multipart/form-data'},
                data: {media: [file]},
                arrayKey: '',
            })
        )))
            .then((results) => {
                const files = results.map((res) => res.data);

                if (get(files, 'length', 0) > 0) {
                    dispatch({
                        type: 'RECEIVE_FILES',
                        payload: files,
                    });
                }
                return Promise.resolve(files);
            }, (error) => Promise.reject(error));
    }
);

const save = (original, updates) => (
    (dispatch, getState, {api}) => {
        let promise;

        if (original) {
            promise = Promise.resolve(original);
        } else if (isExistingItem(updates)) {
            promise = dispatch(
                self.fetchById(updates._id, {saveToStore: false, loadPlanning: false})
            );
        } else {
            promise = Promise.resolve({});
        }

        return promise.then((originalEvent) => {
            const originalItem = eventUtils.modifyForServer(cloneDeep(originalEvent), true);

            // clone the updates as we're going to modify it
            let eventUpdates = eventUtils.modifyForServer(
                cloneDeep(updates),
                true
            );

            originalItem.location = originalItem.location ? [originalItem.location] : null;

            // remove all properties starting with _
            // and updates that are the same as original
            eventUpdates = pickBy(eventUpdates, (v, k) => (
                (k === TO_BE_CONFIRMED_FIELD || k === '_planning_item' || !k.startsWith('_')) &&
                !isEqual(eventUpdates[k], originalItem[k])
            ));

            if (get(originalItem, 'lock_action') === EVENTS.ITEM_ACTIONS.EDIT_EVENT.lock_action &&
                !isTemporaryId(originalItem._id)
            ) {
                delete eventUpdates.dates;
            }
            eventUpdates.update_method = get(eventUpdates, 'update_method.value') ||
                EventUpdateMethods[0].value;

            return api('events').save(originalItem, eventUpdates);
        })
            .then(
                (data) => Promise.resolve(get(data, '_items') || [data]),
                (error) => Promise.reject(error)
            );
    }
);

const updateRepetitions = (original, updates) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_update_repetitions',
            original,
            {dates: updates.dates}
        )
    )
);

const fetchEventFiles = (event) => (
    (dispatch, getState, {api}) => {
        if (!eventUtils.shouldFetchFilesForEvent(event)) {
            return Promise.resolve();
        }

        const filesInStore = selectors.general.files(getState());

        if (every(event.files, (f) => f in filesInStore)) {
            return Promise.resolve();
        }

        return api('events_files').query(
            {
                where: {$and: [{_id: {$in: event.files}}]},
            }
        )
            .then((data) => {
                if (get(data, '_items.length')) {
                    dispatch({
                        type: 'RECEIVE_FILES',
                        payload: get(data, '_items'),
                    });
                }
                return Promise.resolve();
            });
    }
);

const removeFile = (file) => (
    (dispatch, getState, {api, notify}) => (
        api('events_files').remove(file)
            .then(() => {
                dispatch({
                    type: 'REMOVE_FILE',
                    payload: file._id,
                });
            }, (err) => {
                notify.error(
                    getErrorMessage(err, gettext('Failed to remove the file from event.'))
                );
                return Promise.reject(err);
            })
    )
);

const fetchCalendars = () => (
    (dispatch, getState, {vocabularies}) => (
        vocabularies.getVocabularies()
            .then((vocabularies) => {
                const vocab = find(vocabularies, {_id: 'event_calendars'});
                const calendars = get(vocab, 'items') || [];

                dispatch(self.receiveCalendars(calendars));

                return Promise.resolve(calendars);
            }, (error) => Promise.reject(error))
    )
);

const receiveCalendars = (calendars) => ({
    type: EVENTS.ACTIONS.RECEIVE_CALENDARS,
    payload: calendars,
});

const fetchEventTemplates = () => (dispatch, getState, {api}) => {
    api('recent_events_template').query()
        .then((res) => {
            dispatch({type: EVENTS.ACTIONS.RECEIVE_EVENT_TEMPLATES, payload: res._items});
        });
};

const createEventTemplate = (itemId) => (dispatch, getState, {api, modal, notify}) => {
    modal.prompt(gettext('Template name')).then((templateName) => {
        api('events_template').query({
            where: {
                template_name: {
                    $regex: templateName,
                    $options: 'i',
                },
            },
        })
            .then((res) => {
                const doSave = () => {
                    api('events_template').save({
                        template_name: templateName,
                        based_on_event: itemId,
                    })
                        .then(() => {
                            dispatch(fetchEventTemplates());
                        }, (error) => {
                            notify.error(
                                getErrorMessage(error, gettext('Failed to save the event template'))
                            );
                            return Promise.reject(error);
                        });
                };

                const templateAlreadyExists = res._meta.total !== 0;

                if (templateAlreadyExists) {
                    modal.confirm(gettext(
                        'Template already exists. Do you want to overwrite it?'
                    ))
                        .then(() => {
                            api.remove(res._items[0], {}, 'events_template').then(doSave);
                        });
                } else {
                    doSave();
                }
            });
    });
};

// eslint-disable-next-line consistent-this
const self = {
    loadEventsByRecurrenceId,
    spike,
    unspike,
    query,
    refetch,
    receiveEvents,
    lock,
    unlock,
    silentlyFetchEventsById,
    cancelEvent,
    markEventCancelled,
    markEventHasPlannings,
    rescheduleEvent,
    updateEventTime,
    markEventPostponed,
    postponeEvent,
    loadEventDataForAction,
    getEvent,
    loadAssociatedPlannings,
    post,
    fetchEventHistory,
    unpost,
    uploadFiles,
    save,
    fetchById,
    updateRepetitions,
    fetchCalendars,
    receiveCalendars,
    fetchEventFiles,
    removeFile,
    fetchEventTemplates,
    createEventTemplate,
};

export default self;
