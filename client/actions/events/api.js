import {
    EVENTS,
    SPIKED_STATE,
    POST_STATE,
    MAIN,
} from '../../constants';
import {EventUpdateMethods} from '../../components/Events';
import {get, isEqual, cloneDeep, pickBy, isNil, has, find} from 'lodash';
import * as selectors from '../../selectors';
import {
    eventUtils,
    getTimeZoneOffset,
    lockUtils,
    sanitizeTextForQuery,
    getErrorMessage,
    appendStatesQueryForAdvancedSearch,
    timeUtils,
    isExistingItem,
} from '../../utils';
import moment from 'moment';

import planningApi from '../planning/api';
import eventsUi from './ui';
import locationApi from '../locations';
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
            onlyFuture: false,
        }))
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


const getCriteria = (
    {
        calendars,
        noCalendarAssigned = false,
        advancedSearch = {},
        fulltext,
        recurrenceId,
        spikeState = SPIKED_STATE.NOT_SPIKED,
        onlyFuture = true,
        must = [],
        startOfWeek = 0,
    }
) => {
    let query = {};
    const filter = {};
    let mustNot = [];

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
            condition: () => (advancedSearch.name),
            do: () => {
                let queryText = sanitizeTextForQuery(advancedSearch.name);

                must.push({
                    query_string: {
                        query: 'name:(' + queryText + ')',
                        lenient: false,
                        default_operator: 'AND',
                    },
                });
            },
        },
        {
            condition: () => (advancedSearch.source),
            do: () => {
                const providers = advancedSearch.source.map((provider) => provider.name);

                must.push({terms: {source: providers}});
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
            condition: () => true,
            do: () => {
                if (calendars) {
                    const numCalendars = get(calendars, 'length', 0);

                    if (numCalendars > 1) {
                        must.push({terms: {'calendars.qcode': calendars}});
                    } else if (numCalendars === 1) {
                        must.push({term: {'calendars.qcode': calendars[0]}});
                    }
                } else if (noCalendarAssigned) {
                    mustNot.push({
                        constant_score: {filter: {exists: {field: 'calendars'}}},
                    });
                }
            },
        },
        {
            condition: () => (advancedSearch.anpa_category),
            do: () => {
                const codes = advancedSearch.anpa_category.map((cat) => cat.qcode);

                must.push({terms: {'anpa_category.qcode': codes}});
            },
        },
        {
            condition: () => (advancedSearch.subject),
            do: () => {
                const codes = advancedSearch.subject.map((sub) => sub.qcode);

                must.push({terms: {'subject.qcode': codes}});
            },
        },
        {
            condition: () => (get(advancedSearch, 'dates')),
            do: () => {
                if (get(advancedSearch, 'dates.range')) {
                    let rangeType = get(advancedSearch, 'dates.range');
                    let dateFilters;

                    if (rangeType === MAIN.DATE_RANGE.TODAY) {
                        dateFilters = {
                            filters: [
                                // start date falls today
                                {
                                    range: {
                                        'dates.start': {
                                            gte: 'now/d',
                                            lt: 'now+24h/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // end date falls today
                                {
                                    range: {
                                        'dates.end': {
                                            gte: 'now/d',
                                            lt: 'now+24h/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // today is between dates.start and dates.end
                                {
                                    and: {
                                        filters: [
                                            {
                                                range: {
                                                    'dates.start': {
                                                        lt: 'now/d',
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                            {
                                                range: {
                                                    'dates.end': {
                                                        gt: 'now+24h/d',
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        };
                    } else if (rangeType === MAIN.DATE_RANGE.TOMORROW) {
                        dateFilters = {
                            filters: [
                                // start date falls tomorrow
                                {
                                    range: {
                                        'dates.start': {
                                            gte: 'now+24h/d',
                                            lt: 'now+48h/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // end date falls today
                                {
                                    range: {
                                        'dates.end': {
                                            gte: 'now+24h/d',
                                            lt: 'now+48h/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // today is between dates.start and dates.end
                                {
                                    and: {
                                        filters: [
                                            {
                                                range: {
                                                    'dates.start': {
                                                        lt: 'now+24h/d',
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                            {
                                                range: {
                                                    'dates.end': {
                                                        gt: 'now+48h/d',
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        };
                    } else if (rangeType === MAIN.DATE_RANGE.LAST_24) {
                        dateFilters = {
                            filters: [
                                // start date in last 24 hours
                                {
                                    range: {
                                        'dates.start': {
                                            gte: 'now-24h',
                                            lt: 'now',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // end date in last 24 hours
                                {
                                    range: {
                                        'dates.end': {
                                            gte: 'now-24h',
                                            lt: 'now',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // last 24 hours is between dates.start and dates.end
                                {
                                    and: {
                                        filters: [
                                            {
                                                range: {
                                                    'dates.start': {
                                                        lt: 'now-24h',
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                            {
                                                range: {
                                                    'dates.end': {
                                                        gt: 'now',
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        };
                    } else if (rangeType === MAIN.DATE_RANGE.THIS_WEEK) {
                        let startOfNextWeek = timeUtils.getStartOfNextWeek(null, startOfWeek);
                        let startOfWeek = startOfNextWeek.clone().subtract(7, 'days');

                        startOfWeek = startOfWeek.format('YYYY-MM-DD') + '||/d';
                        startOfNextWeek = startOfNextWeek.format('YYYY-MM-DD') + '||/d';

                        dateFilters = {
                            filters: [
                                // start date in this week
                                {
                                    range: {
                                        'dates.start': {
                                            gte: startOfWeek,
                                            lt: startOfNextWeek,
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // end date in this week
                                {
                                    range: {
                                        'dates.end': {
                                            gte: startOfWeek,
                                            lt: startOfNextWeek,
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // week is between dates.start and dates.end
                                {
                                    and: {
                                        filters: [
                                            {
                                                range: {
                                                    'dates.start': {
                                                        lt: startOfWeek,
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                            {
                                                range: {
                                                    'dates.end': {
                                                        gte: startOfNextWeek,
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        };
                    } else if (rangeType === MAIN.DATE_RANGE.NEXT_WEEK) {
                        let startOfNextWeek = timeUtils.getStartOfNextWeek(null, startOfWeek).add(7, 'days');
                        let startOfWeek = startOfNextWeek.clone().subtract(7, 'days');

                        startOfWeek = startOfWeek.format('YYYY-MM-DD') + '||/d';
                        startOfNextWeek = startOfNextWeek.format('YYYY-MM-DD') + '||/d';

                        dateFilters = {
                            filters: [
                                // start date in next week
                                {
                                    range: {
                                        'dates.start': {
                                            gte: startOfWeek,
                                            lt: startOfNextWeek,
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // end date in next week
                                {
                                    range: {
                                        'dates.end': {
                                            gte: startOfWeek,
                                            lt: startOfNextWeek,
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                                // next week is between dates.start and dates.end
                                {
                                    and: {
                                        filters: [
                                            {
                                                range: {
                                                    'dates.start': {
                                                        lt: startOfWeek,
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                            {
                                                range: {
                                                    'dates.end': {
                                                        gt: startOfNextWeek,
                                                        time_zone: getTimeZoneOffset(),
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        };
                    }

                    filter.or = dateFilters;
                } else if (advancedSearch.dates.start && !advancedSearch.dates.end) {
                    filter.or = {
                        filters: [
                            {
                                range: {
                                    'dates.start': {
                                        gte: advancedSearch.dates.start,
                                        time_zone: getTimeZoneOffset(),
                                    },
                                },
                            },
                            {
                                range: {
                                    'dates.end': {
                                        gte: advancedSearch.dates.start,
                                        time_zone: getTimeZoneOffset(),
                                    },
                                },
                            },
                        ],
                    };
                } else if (!advancedSearch.dates.start && advancedSearch.dates.end) {
                    filter.or = {
                        filters: [
                            {
                                range: {
                                    'dates.end': {
                                        lte: advancedSearch.dates.end,
                                        time_zone: getTimeZoneOffset(),
                                    },
                                },
                            },
                            {
                                range: {
                                    'dates.start': {
                                        lte: advancedSearch.dates.end,
                                        time_zone: getTimeZoneOffset(),
                                    },
                                },
                            },
                        ],
                    };
                } else if (advancedSearch.dates.start && advancedSearch.dates.end) {
                    filter.or = {
                        filters: [
                            {
                                range: {
                                    'dates.start': {
                                        gte: advancedSearch.dates.start,
                                        time_zone: getTimeZoneOffset(),
                                    },
                                    'dates.end': {
                                        lte: advancedSearch.dates.end,
                                        time_zone: getTimeZoneOffset(),
                                    },
                                },
                            },
                            {
                                and: {
                                    filters: [
                                        {
                                            range: {
                                                'dates.start': {
                                                    lt: advancedSearch.dates.start,
                                                    time_zone: getTimeZoneOffset(),
                                                },
                                            },
                                        },
                                        {
                                            range: {
                                                'dates.end': {
                                                    gt: advancedSearch.dates.end,
                                                    time_zone: getTimeZoneOffset(),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                or: {
                                    filters: [
                                        {
                                            range: {
                                                'dates.start': {
                                                    gte: advancedSearch.dates.start,
                                                    lte: advancedSearch.dates.end,
                                                    time_zone: getTimeZoneOffset(),
                                                },
                                            },
                                        },
                                        {
                                            range: {
                                                'dates.end': {
                                                    gte: advancedSearch.dates.start,
                                                    lte: advancedSearch.dates.end,
                                                    time_zone: getTimeZoneOffset(),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    };
                } else {
                    filter.range = {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}};
                }
            },
        },
        {
            condition: () => (advancedSearch.slugline),
            do: () => {
                let queryText = sanitizeTextForQuery(advancedSearch.slugline);

                must.push({
                    query_string: {
                        query: 'slugline:(' + queryText + ')',
                        lenient: false,
                        default_operator: 'AND',
                    },
                });
            },
        },
        {
            condition: () => (advancedSearch.posted),
            do: () => {
                must.push({term: {pubstatus: POST_STATE.USABLE}});
            },
        },
    // loop over actions and performs if conditions are met
    ].forEach((action) => {
        if (action.condition()) {
            action.do();
        }
    });

    // if advanced search dates are not specified and onlyfuture events
    if (!get(advancedSearch, 'dates') && onlyFuture) {
        filter.range = {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}};
    }

    // Handle 'state' and 'spiked' requirements
    appendStatesQueryForAdvancedSearch(advancedSearch, spikeState, mustNot, must);

    query.bool = {
        must: must,
        must_not: mustNot,
    };

    return {query, filter};
};

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
 * @param {boolean} storeTotal - True to store total in the store
 * @return arrow function
 */
const query = (
    {
        calendars,
        noCalendarAssigned = false,
        advancedSearch = {},
        fulltext,
        ids,
        recurrenceId,
        spikeState = SPIKED_STATE.NOT_SPIKED,
        onlyFuture = true,
        page = 1,
        maxResults = MAIN.PAGE_SIZE,
    },
    storeTotal = false
) => (
    (dispatch, getState, {api}) => {
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
                    Array.prototype.concat.apply([], responses)
                ));
            }
        }

        const startOfWeek = selectors.config.getStartOfWeek(getState());
        const criteria = self.getCriteria(
            {
                calendars,
                noCalendarAssigned,
                advancedSearch,
                fulltext,
                recurrenceId,
                spikeState,
                onlyFuture,
                must,
                startOfWeek,
            });

        // Query the API and sort by date
        return api('events').query({
            page: page,
            max_results: maxResults,
            sort: '[("dates.start",1)]',
            source: JSON.stringify({
                query: criteria.query,
                filter: criteria.filter,
            }),
        })
        // convert dates to moment objects
            .then((data) => {
                const results = {
                    ...data,
                    _items: data._items.map(eventUtils.modifyForClient),
                };

                if (storeTotal) {
                    dispatch(main.setTotal(MAIN.FILTERS.EVENTS, get(data, '_meta.total')));
                }
                return get(results, '_items');
            });
    }
);

/**
 * Action Dispatcher to re-fetch the current list of events
 * It achieves this by performing a fetch using the params from
 * the store value `events.lastRequestParams`
 */
const refetch = () => (
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

                dispatch(self.receiveEvents(events));
                return Promise.resolve(events);
            }, (error) => (Promise.reject(error)));
    }
);

/**
 * Action dispatcher to load all events from the series of events,
 * then load their associated planning items.
 * @param {object} event - Any event from the series of recurring events
 * @param {boolean} loadPlannings - If true, loads associated Planning items as well
 * @param {boolean} loadEvents - If true, also loads all Events in the series
 */
const loadRecurringEventsAndPlanningItems = (event, loadPlannings = true, loadEvents = true) => (
    (dispatch) => {
        if (get(event, 'recurrence_id') && loadEvents) {
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
            if (!loadPlannings || get(event, 'planning_ids.length', 0) < 1) {
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

const loadEventDataForAction = (event, loadPlanning = true, post = false, loadEvents = true) => (
    (dispatch) => (
        dispatch(self.loadRecurringEventsAndPlanningItems(event, loadPlanning, loadEvents))
            .then((relatedEvents) => {
                let modifiedEvent = {
                    ...event,
                    dates: {
                        ...event.dates,
                        start: moment(event.dates.start),
                        end: moment(event.dates.end),
                    },
                    type: 'event',
                    _recurring: relatedEvents.events,
                    _post: post,
                    _events: [],
                    _originalEvent: event,
                    _plannings: relatedEvents.plannings,
                    _relatedPlannings: relatedEvents.plannings.filter(
                        (p) => p.event_item === event._id
                    ),
                };

                if (get(modifiedEvent, 'dates.recurring_rule.until')) {
                    modifiedEvent.dates.recurring_rule.until =
                        moment(modifiedEvent.dates.recurring_rule.until);
                }

                return Promise.resolve(modifiedEvent);
            }, (error) => Promise.reject(error))
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
const receiveEvents = (events) => ({
    type: EVENTS.ACTIONS.ADD_EVENTS,
    payload: events,
    receivedAt: Date.now(),
});

const lock = (event, action = 'edit') => (
    (dispatch, getState, {api, notify}) => {
        if (action === null ||
            lockUtils.isItemLockedInThisSession(event, selectors.general.session(getState()))
        ) {
            return Promise.resolve(event);
        }

        return api('events_lock', event).save({}, {lock_action: action})
            .then(
                (item) => {
                    // On lock, file object in the event is lost, so, replace it from original event
                    item.files = event.files;

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
                (item) => Promise.resolve(item),
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
const silentlyFetchEventsById = (ids, spikeState = SPIKED_STATE.NOT_SPIKED, saveToStore = true) => (
    (dispatch, getState, {api}) => (
        new Promise((resolve, reject) => {
            if (Array.isArray(ids)) {
                dispatch(self.query({
                    // distinct ids
                    ids: ids.filter((v, i, a) => (a.indexOf(v) === i)),
                    spikeState: spikeState,
                    onlyFuture: false,
                }))
                    .then(
                        (items) => resolve(items),
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

/**
 * Action Dispatcher to fetch a single event using its ID
 * and add or update the Event in the Redux Store
 * @param {string} eventId - The ID of the Event to fetch
 * @param {boolean} force - Force using the API instead of Redux store
 * @param {boolean} saveToStore - If true, save the Event item in the Redux store
 * @param {boolean} loadPlanning - If true, load associated Planning items as well
 */
const fetchById = (eventId, {force = false, saveToStore = true, loadPlanning = true} = {}) => (
    (dispatch, getState, {api}) => {
        // Test if the Event item is already loaded into the store
        // If so, return that instance instead
        const storedEvents = selectors.events.storedEvents(getState());
        let promise;

        if (has(storedEvents, eventId) && !force) {
            promise = Promise.resolve(storedEvents[eventId]);
        } else {
            promise = api.find('events', eventId, {embedded: {files: 1}})
                .then((event) => {
                    const newEvent = eventUtils.modifyForClient(event);

                    if (saveToStore) {
                        dispatch(self.receiveEvents([newEvent]));
                    }

                    return Promise.resolve(newEvent);
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

const post = (event) => (
    (dispatch, getState, {api}) => (
        api.save('events_post', {
            event: event._id,
            etag: event._etag,
            pubstatus: POST_STATE.USABLE,
            update_method: get(event, 'update_method.value', EventUpdateMethods[0].value),
        })
    )
);

const updateEventTime = (event) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_update_time',
            event,
            {
                update_method: get(event, 'update_method.value', EventUpdateMethods[0].value),
                dates: event.dates,
            }
        )
    )
);

const markEventCancelled = (eventId, etag, reason, occurStatus, cancelledItems) => ({
    type: EVENTS.ACTIONS.MARK_EVENT_CANCELLED,
    payload: {
        event_id: eventId,
        etag: etag,
        reason: reason,
        occur_status: occurStatus,
        cancelled_items: cancelledItems,
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
            .then((data) => {
                dispatch(eventsUi.receiveEventHistory(data._items));
                return data;
            })
    )
);

/**
 * Set event.pubstatus canceled and post event.
 *
 * @param {Object} event
 */
const unpost = (event) => (
    (dispatch, getState, {api, notify}) => (
        api.save('events_post', {
            event: event._id,
            etag: event._etag,
            pubstatus: POST_STATE.CANCELLED,
            update_method: get(event, 'update_method.value', EventUpdateMethods[0].value),
        })
    )
);

const _uploadFiles = (event) => (
    (dispatch, getState, {upload}) => {
        const clonedEvent = cloneDeep(event);

        // If no files, do nothing
        if (get(clonedEvent, 'files.length', 0) === 0) {
            return Promise.resolve([]);
        }

        // Calculate the files to upload
        const filesToUpload = clonedEvent.files.filter(
            (f) => f instanceof FileList || f instanceof Array
        );

        if (filesToUpload.length < 1) {
            return Promise.resolve([]);
        }

        return Promise.all(filesToUpload.map((file) => (
            upload.start({
                method: 'POST',
                url: getState().config.server.url + '/events_files/',
                headers: {'Content-Type': 'multipart/form-data'},
                data: {media: [file]},
                arrayKey: '',
            })
                .then(
                    (file) => Promise.resolve(file.data),
                    (error) => Promise.reject(error)
                )
        )));
    }
);

/**
 * Action Dispatcher for saving the location for an event
 * @param {object} event - The event the location is associated with
 * @return arrow function
 */
const _saveLocation = (event) => (
    (dispatch) => {
        const location = get(event, 'location');

        if (!location || !location.name) {
            delete event.location;
            return Promise.resolve(event);
        } else if (location.existingLocation) {
            event.location = {
                name: location.name,
                qcode: location.guid,
                address: location.address,
            };

            // external address might not be there.
            if (get(location, 'address.external')) {
                delete location.address.external;
            }

            return Promise.resolve(event);
        } else if (isNil(location.qcode)) {
            // the location is set, but doesn't have a qcode (not registered in the location collection)
            return dispatch(locationApi.saveLocation(location))
                .then((savedLocation) => {
                    event.location = savedLocation;
                    return Promise.resolve(event);
                });
        } else {
            return Promise.resolve(event);
        }
    }
);

const _save = (eventUpdates) => (
    (dispatch, getState, {api}) => (
        !isExistingItem(eventUpdates) ?
            Promise.resolve({}) :
            dispatch(self.fetchById(eventUpdates._id, {saveToStore: false, loadPlanning: false}))
    )
        .then((originalEvent) => {
            // clone the original because `save` will modify it
            const original = cloneDeep(originalEvent);

            // clone the updates as we're going to modify it
            let updates = eventUtils.modifyForServer(cloneDeep(eventUpdates), true);

            original.location = original.location ? [original.location] : null;

            // remove all properties starting with _
            // and updates that are the same as original
            updates = pickBy(updates, (v, k) => (
                (k === '_planning_item' || !k.startsWith('_')) &&
                !isEqual(updates[k], original[k])
            ));

            updates.update_method = get(updates, 'update_method.value') || EventUpdateMethods[0].value;

            return api('events').save(original, updates);
        })
        .then((data) => (
            Promise.resolve(get(data, '_items') || [data])
        ), (error) => Promise.reject(error))
);

const save = (event) => (
    (dispatch, getState, {notify}) => (
        Promise.all([
            dispatch(self._uploadFiles(event)), // Returns the new files uploaded
            dispatch(self._saveLocation(event)), // Returns the modified unsaved event with the locations changes
        ])
            .then((data) => {
                const newFiles = data[0];
                const modifiedEvent = data[1];
                const originalFiles = get(modifiedEvent, 'files', []).filter(
                    (f) => !(f instanceof FileList) && !(f instanceof Array)
                );

                modifiedEvent.files = [
                    ...originalFiles.map((e) => e._id),
                    ...newFiles.map((e) => e._id),
                ];

                return dispatch(self._save(modifiedEvent));
            })
    )
);

const updateRepetitions = (event) => (
    (dispatch, getState, {api}) => (
        api.update(
            'events_update_repetitions',
            event,
            {dates: event.dates}
        )
    )
);

const getEventContacts = (searchText, searchFields = []) => (
    (dispatch, getState, {api}) => api('contacts')
        .query({
            source: {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                default_field: 'first_name',
                                fields: searchFields,
                                query: searchText + '*',
                            },
                        }],
                        should: [
                            {term: {is_active: true}},
                            {term: {public: true}},
                        ],
                    },
                },
            },
        })
);

const fetchEventContactsByIds = (ids = []) => (
    (dispatch, getState, {api}) => api('contacts')
        .query({
            source: {
                query: {
                    bool: {
                        must: [{
                            terms: {
                                _id: ids,
                            },
                        }],
                        should: [
                            {term: {is_active: true}},
                            {term: {public: true}},
                        ],
                    },
                },
            },
        })
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

// eslint-disable-next-line consistent-this
const self = {
    loadEventsByRecurrenceId,
    spike,
    unspike,
    query,
    refetch,
    receiveEvents,
    loadRecurringEventsAndPlanningItems,
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
    queryLockedEvents,
    getEvent,
    loadAssociatedPlannings,
    post,
    fetchEventHistory,
    unpost,
    _uploadFiles,
    _save,
    save,
    _saveLocation,
    getCriteria,
    fetchById,
    updateRepetitions,
    getEventContacts,
    fetchEventContactsByIds,
    fetchCalendars,
    receiveCalendars,
};

export default self;
