import {EVENTS, SPIKED_STATE, WORKFLOW_STATE, PUBLISHED_STATE} from '../../constants';
import {EventUpdateMethods} from '../../components/fields';
import {get, isEqual} from 'lodash';
import * as selectors from '../../selectors';
import {isItemLockedInThisSession} from '../../utils';
import moment from 'moment';

import planningApi from '../planning/api';

/**
 * Action dispatcher to load a series of recurring events into the local store.
 * This does not update the list of visible Events
 * @param rid
 * @param spikeState
 */
const loadEventsByRecurrenceId = (
    rid,
    spikeState = SPIKED_STATE.BOTH,
    page = 1,
    maxResults = 25,
    loadToStore = true
) => (
    (dispatch) => (
        dispatch(self.query({
            recurrenceId: rid,
            spikeState: spikeState,
            page: page,
            maxResults: maxResults,
        }))
            .then((data) => {
                if (loadToStore) {
                    dispatch(self.receiveEvents(data._items));
                }

                return Promise.resolve(data._items);
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
            eventsToUnspike.map((event) => api.update('events_unspike', event, {}))
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
 * @param {object} advancedSearch - Query parameters to send to the server
 * @param {object} fulltext - Full text search parameters
 * @param {Array} ids - An array of Event IDs to fetch
 * @param {string} recurrenceId - The recurrence_id to fetch recurring events
 * @param {date} startDateGreaterThan - Start date range
 * @param {int} page - The page number to fetch
 * @param {string} state - The item state to filter by
 * @return arrow function
 */
const query = (
    {
        advancedSearch = {},
        fulltext,
        ids,
        recurrenceId,
        startDateGreaterThan,
        page = 1,
        maxResults = 25,
        spikeState = SPIKED_STATE.NOT_SPIKED,
    }
) => (
    (dispatch, getState, {api}) => {
        let query = {};
        const filter = {};
        let mustNot = [];
        let must = [];

        if (ids) {
            const chunkSize = EVENTS.FETCH_IDS_CHUNK_SIZE;

            if (ids.length <= chunkSize) {
                must.push({terms: {_id: ids}});
            } else {
                // chunk the requests
                const requests = [];

                for (let i = 0; i < Math.ceil(ids.length / chunkSize); i++) {
                    const args = {
                        ...arguments[0],
                        ids: ids.slice(i * chunkSize, (i + 1) * chunkSize),
                    };

                    requests.push(dispatch(self.query(args)));
                }
                // flattern responses and return a response-like object
                return Promise.all(requests).then((responses) => (
                    {_items: Array.prototype.concat(...responses.map((r) => r._items))}
                ));
            }
        }
        // List of actions to perform if the condition is true
        [
            {
                condition: () => (fulltext),
                do: () => {
                    must.push({query_string: {query: fulltext}});
                },
            },
            {
                condition: () => (recurrenceId),
                do: () => {
                    must.push({term: {recurrence_id: recurrenceId}});
                },
            },
            {
                condition: () => (startDateGreaterThan),
                do: () => {
                    filter.range = {
                        ...get(filter, 'range', {}),
                        'dates.start': {gt: startDateGreaterThan},
                    };
                },
            },
            {
                condition: () => (advancedSearch.name),
                do: () => {
                    must.push({query_string: {query: advancedSearch.name}});
                },
            },
            {
                condition: () => (advancedSearch.source),
                do: () => {
                    const providers = advancedSearch.source.map((provider) => provider.name);
                    const queries = providers.map((provider) => (
                        {term: {source: provider}}
                    ));

                    must.push(...queries);
                },
            },
            {
                condition: () => (advancedSearch.location),
                do: () => {
                    const location = get(advancedSearch.location, 'name', advancedSearch.location);

                    must.push({match_phrase: {'location.name': location}});
                },
            },
            {
                condition: () => (advancedSearch.calendars),
                do: () => {
                    const codes = advancedSearch.calendars.map((cat) => cat.qcode);
                    const queries = codes.map((code) => (
                        {term: {'calendars.qcode': code}}
                    ));

                    must.push(...queries);
                },
            },
            {
                condition: () => (advancedSearch.anpa_category),
                do: () => {
                    const codes = advancedSearch.anpa_category.map((cat) => cat.qcode);
                    const queries = codes.map((code) => (
                        {term: {'anpa_category.qcode': code}}
                    ));

                    must.push(...queries);
                },
            },
            {
                condition: () => (advancedSearch.subject),
                do: () => {
                    const codes = advancedSearch.subject.map((sub) => sub.qcode);
                    const queries = codes.map((code) => (
                        {term: {'subject.qcode': code}}
                    ));

                    must.push(...queries);
                },
            },
            {
                condition: () => (advancedSearch.dates),
                do: () => {
                    const range = {};

                    if (advancedSearch.dates.start) {
                        range['dates.start'] = {gte: advancedSearch.dates.start};
                    }

                    if (advancedSearch.dates.end) {
                        range['dates.end'] = {lte: advancedSearch.dates.end};
                    }

                    filter.range = range;
                },
            },
        // loop over actions and performs if conditions are met
        ].forEach((action) => {
            if (action.condition()) {
                action.do();
            }
        });

        // default filter
        if (isEqual(filter, {}) && isEqual(must, []) && isEqual(mustNot, [])) {
            filter.range = {'dates.end': {gte: 'now/d'}};
        }

        switch (spikeState) {
        case SPIKED_STATE.SPIKED:
            must.push({term: {state: WORKFLOW_STATE.SPIKED}});
            break;
        case SPIKED_STATE.BOTH:
            break;
        case SPIKED_STATE.NOT_SPIKED:
        default:
            mustNot.push({term: {state: WORKFLOW_STATE.SPIKED}});
        }

        query.bool = {
            must: must,
            must_not: mustNot,
        };

        // Query the API and sort by date
        return api('events').query({
            page: page,
            max_results: maxResults,
            sort: '[("dates.start",1)]',
            embedded: {files: 1},
            source: JSON.stringify({
                query: query,
                filter: filter,
            }),
        })
        // convert dates to moment objects
            .then((data) => ({
                ...data,
                _items: data._items.map((item) => ({
                    ...item,
                    dates: {
                        ...item.dates,
                        start: moment(item.dates.start),
                        end: moment(item.dates.end),
                    },
                })),
            }));
    }
);

/**
 * Action Dispatcher to re-fetch the current list of events
 * It achieves this by performing a fetch using the params from
 * the store value `events.lastRequestParams`
 */
const refetchEvents = () => (
    (dispatch, getState) => {
        const prevParams = selectors.getPreviousEventRequestParams(getState());

        const promises = [];

        for (let i = 1; i <= prevParams.page; i++) {
            const params = {
                ...prevParams,
                page: i,
            };

            dispatch({
                type: EVENTS.ACTIONS.REQUEST_EVENTS,
                payload: params,
            });
            promises.push(dispatch(self.query(params)));
        }

        return Promise.all(promises)
            .then((responses) => {
                let events = responses
                    .map((e) => e._items)
                    .reduce((a, b) => a.concat(b));

                dispatch(self.receiveEvents(events));
                return Promise.resolve(events);
            }, (error) => (Promise.reject(error)));
    }
);

/**
 * Action dispatcher to load all events from the series of events,
 * then load their associated planning items.
 * @param {object} event - Any event from the series of recurring events
 */
const loadRecurringEventsAndPlanningItems = (event, loadPlannings = true) => (
    (dispatch) => {
        if (get(event, 'recurrence_id')) {
            return dispatch(self.loadEventsByRecurrenceId(
                event.recurrence_id,
                SPIKED_STATE.BOTH,
                1,
                200,
                false
            )).then((relatedEvents) => {
                if (!loadPlannings) {
                    return Promise.resolve({
                        events: relatedEvents,
                        plannings: [],
                    });
                }

                return dispatch(planningApi.loadPlanningByRecurrenceId(
                    event.recurrence_id,
                    false
                ))
                    .then((plannings) => (
                        Promise.resolve({
                            events: relatedEvents,
                            plannings: plannings,
                        })
                    ), (error) => Promise.reject(error));
            }, (error) => Promise.reject(error));
        } else {
            if (!loadPlannings || !get(event, 'has_planning', false)) {
                return Promise.resolve({
                    events: [],
                    plannings: [],
                });
            }

            return dispatch(planningApi.loadPlanningByEventId(event._id))
                .then((plannings) => (
                    Promise.resolve({
                        events: [],
                        plannings: plannings,
                    })
                ));
        }
    }
);

const loadEventDataForAction = (event, loadPlanning = true, publish = false) => (
    (dispatch) => (
        dispatch(self.loadRecurringEventsAndPlanningItems(event, loadPlanning))
            .then((relatedEvents) => (
                Promise.resolve({
                    ...event,
                    dates: {
                        ...event.dates,
                        start: moment(event.dates.start),
                        end: moment(event.dates.end),
                    },
                    _recurring: relatedEvents.events,
                    _publish: publish,
                    _events: [],
                    _originalEvent: event,
                    _plannings: relatedEvents.plannings,
                    _relatedPlannings: relatedEvents.plannings.filter(
                        (p) => p.event_item === event._id
                    ),
                })
            ), (error) => Promise.reject(error))
    )
);

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
 * Action dispatcher to query the API for all Events that are currently locked
 * @return Array of locked Events
 */
const queryLockedEvents = () => (
    (dispatch, getState, {api}) => (
        api('events').query({
            source: JSON.stringify(
                {query: {constant_score: {filter: {exists: {field: 'lock_session'}}}}}
            ),
        })
            .then(
                (data) => Promise.resolve(data._items),
                (error) => Promise.reject(error)
            )
    )
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
        const events = selectors.getEvents(getState());

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
const receiveEvents = (events) => ({
    type: EVENTS.ACTIONS.ADD_EVENTS,
    payload: events,
    receivedAt: Date.now(),
});

const lock = (event, action = 'edit') => (
    (dispatch, getState, {api, notify}) => {
        if (action === null ||
            isItemLockedInThisSession(event, selectors.getSessionDetails(getState()))
        ) {
            return Promise.resolve(event);
        }

        return api('events_lock', event).save({}, {lock_action: action})
            .then(
                (item) => {
                // On lock, file object in the event is lost, so, replace it from original event
                    item.files = event.files;
                    return item;
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
            .then((item) => (item),
                (error) => {
                    const msg = get(error, 'data._message') || 'Could not unlock the event.';

                    notify.error(msg);
                    throw error;
                })
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
const silentlyFetchEventsById = (ids, spikeState = SPIKED_STATE.NOT_SPIKED, saveToStore = true) => (
    (dispatch, getState, {api}) => (
        new Promise((resolve, reject) => {
            if (Array.isArray(ids)) {
                dispatch(self.query({
                    // distinct ids
                    ids: ids.filter((v, i, a) => (a.indexOf(v) === i)),
                    spikeState: spikeState,
                }))
                    .then(
                        (data) => resolve(data._items),
                        (error) => reject(error)
                    );
            } else {
                api('events').getById(ids)
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

const cancelEvent = (event) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_cancel',
            event,
            {
                update_method: get(event, 'update_method.value', EventUpdateMethods[0].value),
                reason: get(event, 'reason', undefined),
            }
        )
    )
);

const rescheduleEvent = (event) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_reschedule',
            event,
            {
                update_method: get(event, 'update_method.value', EventUpdateMethods[0].value),
                dates: event.dates,
                reason: get(event, 'reason', null),
            }
        )
    )
);

const postponeEvent = (event) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_postpone',
            event,
            {
                update_method: get(event, 'update_method.value', EventUpdateMethods[0].value),
                reason: get(event, 'reason', undefined),
            }
        )
    )
);

const publishEvent = (event) => (
    (dispatch, getState, {api}) => (
        api.save('events_publish', {
            event: event._id,
            etag: event._etag,
            pubstatus: PUBLISHED_STATE.USABLE,
        })
    )
);

const markEventCancelled = (event, reason, occurStatus) => ({
    type: EVENTS.ACTIONS.MARK_EVENT_CANCELLED,
    payload: {
        event: event,
        reason: reason,
        occur_status: occurStatus,
    },
});

const markEventPostponed = (event, reason) => ({
    type: EVENTS.ACTIONS.MARK_EVENT_POSTPONED,
    payload: {
        event: event,
        reason: reason,
    },
});

const markEventHasPlannings = (event, planning) => ({
    type: EVENTS.ACTIONS.MARK_EVENT_HAS_PLANNINGS,
    payload: {
        event_item: event,
        planning_item: planning,
    },
});

// eslint-disable-next-line consistent-this
const self = {
    loadEventsByRecurrenceId,
    spike,
    unspike,
    query,
    refetchEvents,
    receiveEvents,
    loadRecurringEventsAndPlanningItems,
    lock,
    unlock,
    silentlyFetchEventsById,
    cancelEvent,
    markEventCancelled,
    markEventHasPlannings,
    rescheduleEvent,
    markEventPostponed,
    postponeEvent,
    loadEventDataForAction,
    queryLockedEvents,
    getEvent,
    loadAssociatedPlannings,
    publishEvent,
};

export default self;
