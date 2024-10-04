import {get, isEqual, cloneDeep, pickBy, has, find, every, take} from 'lodash';

import {planningApi} from '../../superdeskApi';
import {ISearchSpikeState, IEventSearchParams, IEventItem, IPlanningItem, IEventTemplate} from '../../interfaces';
import {appConfig} from 'appConfig';

import {
    EVENTS,
    POST_STATE,
    MAIN,
    TO_BE_CONFIRMED_FIELD,
} from '../../constants';
import * as selectors from '../../selectors';
import {
    eventUtils,
    getErrorMessage,
    isExistingItem,
    isValidFileInput,
    isPublishedItemId,
    isTemporaryId,
    gettext,
    getTimeZoneOffset,
} from '../../utils';

import planningApis from '../planning/api';
import eventsUi from './ui';
import main from '../main';
import {eventParamsToSearchParams} from '../../utils/search';
import {getRelatedEventIdsForPlanning} from '../../utils/planning';

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
        planningApi.events.search({
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
                event.update_method = get(event, 'update_method.value', EVENTS.UPDATE_METHODS[0].value);
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
                event.update_method = get(event, 'update_method.value', EVENTS.UPDATE_METHODS[0].value);
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

// Action Dispatcher for query the api for events
function query(
    params: IEventSearchParams = {},
    storeTotal = false
) {
    return (dispatch, getState) => {
        let itemIds = [];

        if (params.ids) {
            const chunkSize = EVENTS.FETCH_IDS_CHUNK_SIZE;

            if (params.ids.length <= chunkSize) {
                itemIds = params.ids;
            } else {
                // chunk the requests
                const requests = [];

                for (let i = 0; i < Math.ceil(params.ids.length / chunkSize); i++) {
                    const args = {
                        // eslint-disable-next-line no-undef
                        ...params,
                        ids: params.ids.slice(i * chunkSize, (i + 1) * chunkSize),
                    };

                    requests.push(dispatch(self.query(args)));
                }
                // flatten responses and return a response-like object
                return Promise.all(requests).then((responses) => (
                    Array.prototype.concat.apply([], responses)
                ));
            }
        }

        return planningApi.events.search(eventParamsToSearchParams({
            ...params,
            itemIds: itemIds,
            filter_id: params.filter_id || selectors.main.currentSearchFilterId(getState()),
        }))
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
    return planningApi.combined.getRecurringEventsAndPlanningItems(event, loadPlanning, loadEvents)
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
                    (item) => getRelatedEventIdsForPlanning(item, 'primary').includes(event._id)
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

        return dispatch(planningApis.loadPlanningByEventId(event._id));
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
function getEvent(eventId: IEventItem['_id'], saveToStore: boolean = true) {
    return (dispatch, getState) => {
        const events = selectors.events.storedEvents(getState());

        if (events?.[eventId] != undefined) {
            return Promise.resolve(events[eventId]);
        }

        return dispatch(self.silentlyFetchEventsById([eventId], 'both', saveToStore))
            .then((items) => items[0]);
    };
}

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
 * Action Dispatcher to fetch events from the server,
 * and add them to the store without adding them to the events list
 * @param {Array, string} ids - Either an array of Event IDs or a single Event ID to fetch
 * @param {string} spikeState - Event's spiked state (SPIKED, NOT_SPIKED or BOTH)
 * @param {boolean} saveToStore - If true, save the Event in the Redux store
 * @return arrow function
 */
function silentlyFetchEventsById(
    ids: Array<IEventItem['_id']>,
    spikeState: ISearchSpikeState = 'draft',
    saveToStore: boolean = true
) {
    return (dispatch) => (
        planningApi.events.getByIds(
            ids.filter((v, i, a) => (a.indexOf(v) === i)),
            spikeState
        )
            .then((items) => {
                if (saveToStore && items.length > 0) {
                    dispatch(self.receiveEvents(items));
                }

                return items;
            })
    );
}

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
            promise = planningApi.events.getById(eventId)
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
                update_method: get(updates, 'update_method.value', EVENTS.UPDATE_METHODS[0].value),
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
                update_method: get(updates, 'update_method.value', EVENTS.UPDATE_METHODS[0].value),
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
                update_method: get(updates, 'update_method.value', EVENTS.UPDATE_METHODS[0].value),
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
            update_method: get(updates, 'update_method.value', EVENTS.UPDATE_METHODS[0].value),
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
            update_method: get(updates, 'update_method.value', EVENTS.UPDATE_METHODS[0].value),
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
                update_method: get(updates, 'update_method.value', EVENTS.UPDATE_METHODS[0].value),
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

function markEventPostponed(event: IEventItem, reason: string, actionedDate: string) {
    return (dispatch) => {
        planningApi.locks.setItemAsUnlocked({
            item: event._id,
            type: event.type,
            recurrence_id: event.recurrence_id,
            etag: event._etag,
            from_ingest: false,
            user: event.lock_user,
            lock_session: event.lock_session,
        });
        dispatch({
            type: EVENTS.ACTIONS.MARK_EVENT_POSTPONED,
            payload: {
                event: event,
                reason: reason,
                actionedDate: actionedDate,
            },
        });
    };
}

const markEventHasPlannings = (event, planning) => ({
    type: EVENTS.ACTIONS.MARK_EVENT_HAS_PLANNINGS,
    payload: {
        event_id: event,
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
    (dispatch) => {
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
            const eventUpdates = eventUtils.getEventDiff(originalItem, updates);

            if (get(originalItem, 'lock_action') === EVENTS.ITEM_ACTIONS.EDIT_EVENT.lock_action &&
                !isTemporaryId(originalItem._id)
            ) {
                delete eventUpdates.dates;
            }
            eventUpdates.update_method = eventUpdates.update_method == null ?
                EVENTS.UPDATE_METHODS[0].value :
                eventUpdates.update_method?.value ?? eventUpdates.update_method;

            return originalEvent?._id != null ?
                planningApi.events.update(originalItem, eventUpdates) :
                planningApi.events.create(eventUpdates);
        });
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

const createEventTemplate = (item: IEventItem) => (dispatch, getState, {api, modal, notify}) => {
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
                        based_on_event: item._id,
                        data: {
                        },
                    })
                        .then(() => {
                            dispatch(fetchEventTemplates());
                            dispatch(getEventsRecentTemplates());
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

const RECENT_EVENTS_TEMPLATES_KEY = 'events_templates:recent';

const addEventRecentTemplate = (field: string, templateId: IEventTemplate['_id']) => (
    (dispatch, getState, {preferencesService}) => preferencesService.get()
        .then((result = {}) => {
            result[RECENT_EVENTS_TEMPLATES_KEY] = result[RECENT_EVENTS_TEMPLATES_KEY] || {};
            result[RECENT_EVENTS_TEMPLATES_KEY][field] = result[RECENT_EVENTS_TEMPLATES_KEY][field] || [];
            result[RECENT_EVENTS_TEMPLATES_KEY][field] = result[RECENT_EVENTS_TEMPLATES_KEY][field].filter(
                (i) => i !== templateId);
            result[RECENT_EVENTS_TEMPLATES_KEY][field].unshift(templateId);
            return preferencesService.update(result);
        })
);

const getEventsRecentTemplates = () => (
    (dispatch, getState, {preferencesService}) => preferencesService.get()
        .then((result) => {
            const templates = take(result?.[RECENT_EVENTS_TEMPLATES_KEY]?.['templates'], 5);

            dispatch({type: EVENTS.ACTIONS.EVENT_RECENT_TEMPLATES, payload: templates});
        })
);

// eslint-disable-next-line consistent-this
const self = {
    loadEventsByRecurrenceId,
    spike,
    unspike,
    query,
    refetch,
    receiveEvents,
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
    addEventRecentTemplate,
    getEventsRecentTemplates,
};

export default self;
