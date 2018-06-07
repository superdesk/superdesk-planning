import sinon from 'sinon';
import moment from 'moment';

import {getTimeZoneOffset, eventUtils} from '../../../utils';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {WORKFLOW_STATE, SPIKED_STATE, MAIN} from '../../../constants';

import eventsApi from '../api';
import planningApi from '../../planning/api';
import {EventUpdateMethods} from '../../../components/Events';

describe('actions.events.api', () => {
    let errorMessage;
    let store;
    let services;
    let data;

    beforeEach(() => {
        errorMessage = {data: {_message: 'Failed!'}};
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        sinon.stub(eventsApi, 'query').callsFake(
            () => (Promise.resolve({_items: data.events}))
        );
        sinon.stub(eventsApi, 'refetch').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsApi, 'receiveEvents').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsApi, 'loadEventsByRecurrenceId').callsFake(
            () => (Promise.resolve(data.events))
        );

        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
            () => (Promise.resolve(data.plannings))
        );
        sinon.stub(planningApi, 'loadPlanningByRecurrenceId').callsFake(
            () => (Promise.resolve(data.plannings))
        );
    });

    afterEach(() => {
        restoreSinonStub(eventsApi.query);
        restoreSinonStub(eventsApi.refetch);
        restoreSinonStub(eventsApi.receiveEvents);
        restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
        restoreSinonStub(planningApi.fetch);
        restoreSinonStub(planningApi.loadPlanningByEventId);
        restoreSinonStub(planningApi.loadPlanningByRecurrenceId);
    });

    it('silentlyFetchEventsById', (done) => {
        store.test(done, eventsApi.silentlyFetchEventsById(['e1', 'e2', 'e3'], SPIKED_STATE.BOTH))
            .then(() => {
                expect(eventsApi.query.callCount).toBe(1);
                expect(eventsApi.query.args[0]).toEqual([{
                    ids: ['e1', 'e2', 'e3'],
                    spikeState: SPIKED_STATE.BOTH,
                    onlyFuture: false,
                }]);

                expect(eventsApi.receiveEvents.callCount).toBe(1);
                expect(eventsApi.receiveEvents.args[0]).toEqual([{_items: data.events}]);

                done();
            });
    });

    describe('fetchById', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'loadAssociatedPlannings').callsFake(() => Promise.resolve());
            services.api.find = sinon.spy(() => Promise.resolve(data.events[1]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.loadAssociatedPlannings);
        });

        it('returns the Events from the API (with default options)', (done) => {
            store.init();
            // Clear the store so that the Event is loaded via an api call
            store.initialState.events.events = {};
            store.test(done, eventsApi.fetchById('e2'))
                .then((event) => {
                    expect(event).toEqual(eventUtils.modifyForClient(data.events[1]));

                    expect(services.api.find.callCount).toBe(1);
                    expect(services.api.find.args[0]).toEqual([
                        'events',
                        'e2',
                        {embedded: {files: 1}},
                    ]);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.loadAssociatedPlannings.callCount).toBe(1);

                    done();
                });
        });

        it('returns the Event from the store instead of the API', (done) => (
            store.test(done, eventsApi.fetchById('e2'))
                .then((event) => {
                    expect(event).toEqual(eventUtils.modifyForClient(data.events[1]));

                    expect(services.api.find.callCount).toBe(0);

                    expect(eventsApi.receiveEvents.callCount).toBe(0);
                    expect(eventsApi.loadAssociatedPlannings.callCount).toBe(1);

                    done();
                })
        ));

        it('returns the Event from the API if force = true', (done) => (
            store.test(done, eventsApi.fetchById('e2', {force: true}))
                .then((event) => {
                    expect(event).toEqual(eventUtils.modifyForClient(data.events[1]));

                    expect(services.api.find.callCount).toBe(1);
                    expect(services.api.find.args[0]).toEqual([
                        'events',
                        'e2',
                        {embedded: {files: 1}},
                    ]);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.loadAssociatedPlannings.callCount).toBe(1);

                    done();
                })
        ));

        it('doesnt save to the store if saveToStore = false', (done) => (
            store.test(done, eventsApi.fetchById('e2', {saveToStore: false}))
                .then(() => {
                    expect(eventsApi.receiveEvents.callCount).toBe(0);
                    done();
                })
        ));

        it('doesnt load associated Planning if loadPlanning = false', (done) => (
            store.test(done, eventsApi.fetchById('e2', {loadPlanning: false}))
                .then(() => {
                    expect(eventsApi.loadAssociatedPlannings.callCount).toBe(0);
                    done();
                })
        ));

        it('returns rejected promise if API fails', (done) => {
            services.api.find = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, eventsApi.fetchById('e2', {force: true}))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });

        it('returns rejected promise if loadPlanning fails', (done) => {
            restoreSinonStub(eventsApi.loadAssociatedPlannings);
            sinon.stub(eventsApi, 'loadAssociatedPlannings').callsFake(() => Promise.reject(errorMessage));
            store.test(done, eventsApi.fetchById('e2', {force: true}))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    describe('loadEventsByRecurrenceId', () => {
        beforeEach(() => {
            restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
        });

        it('runs the query', (done) => (
            store.test(done, eventsApi.loadEventsByRecurrenceId('r1', SPIKED_STATE.NOT_SPIKED))
                .then((items) => {
                    expect(items).toEqual({_items: data.events});

                    expect(eventsApi.query.callCount).toBe(1);
                    expect(eventsApi.query.args[0]).toEqual([{
                        recurrenceId: 'r1',
                        spikeState: SPIKED_STATE.NOT_SPIKED,
                        page: 1,
                        maxResults: 25,
                        onlyFuture: false,
                    }]);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.args[0]).toEqual([{_items: data.events}]);

                    done();
                })
        ));

        it('returns Promise.reject if query fails', (done) => {
            restoreSinonStub(eventsApi.query);
            sinon.stub(eventsApi, 'query').callsFake(() => (Promise.reject(errorMessage)));
            store.test(done, eventsApi.loadEventsByRecurrenceId('r1'))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    done();
                });
        });
    });

    describe('spike', () => {
        beforeEach(() => {
            store.initialState.agenda.currentAgendaId = 'a2';
        });

        it('can spike a single event', (done) => (
            store.test(done, eventsApi.spike(data.events[1]))
                .then((items) => {
                    expect(items).toEqual([data.events[1]]);
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_spike',
                        data.events[1],
                        {update_method: EventUpdateMethods[0].value},
                    ]);

                    done();
                })
        ));

        it('can spike multiple events', (done) => (
            store.test(done, eventsApi.spike(data.events))
                .then((items) => {
                    expect(items).toEqual(data.events);
                    expect(services.api.update.callCount).toBe(data.events.length);

                    for (let i = 0; i < data.events.length; i++) {
                        expect(services.api.update.args[i]).toEqual([
                            'events_spike',
                            data.events[i],
                            {update_method: EventUpdateMethods[0].value},
                        ]);
                    }

                    done();
                })
        ));

        it('can send `future` for `update_method`', (done) => {
            data.events[1].update_method = 'future';
            return store.test(done, eventsApi.spike(data.events[1]))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_spike',
                        data.events[1],
                        {update_method: data.events[1].update_method},
                    ]);

                    done();
                });
        });

        it('returns Promise.reject if `events_spike` fails', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject(errorMessage)));
            return store.test(done, eventsApi.spike(data.events[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    describe('unspike', () => {
        it('can unspike a single event', (done) => (
            store.test(done, eventsApi.unspike(data.events[1]))
                .then((items) => {
                    expect(items).toEqual([data.events[1]]);

                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_unspike',
                        data.events[1],
                        {update_method: EventUpdateMethods[0].value},
                    ]);

                    done();
                })
        ));

        it('can unspike multiple events', (done) => (
            store.test(done, eventsApi.unspike(data.events))
                .then((items) => {
                    expect(items).toEqual(data.events);

                    expect(services.api.update.callCount).toBe(data.events.length);
                    for (let i = 0; i < data.events.length; i++) {
                        expect(services.api.update.args[i]).toEqual([
                            'events_unspike',
                            data.events[i],
                            {update_method: EventUpdateMethods[0].value},
                        ]);
                    }

                    done();
                })
        ));

        it('can send `future` for `update_method` when unspiking', (done) => {
            data.events[1].update_method = 'future';
            return store.test(done, eventsApi.unspike(data.events[1]))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_unspike',
                        data.events[1],
                        {update_method: data.events[1].update_method},
                    ]);

                    done();
                });
        });

        it('returns Promise.reject if `events_unspike` fails', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject(errorMessage)));
            return store.test(done, eventsApi.unspike(data.events))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    describe('query', () => {
        beforeEach(() => {
            restoreSinonStub(eventsApi.query);
        });

        it('default query/filter', (done) => (
            store.test(done, eventsApi.query({}))
                .then(() => {
                    expect(services.api('events').query.callCount).toBe(1);
                    expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                        page: 1,
                        sort: '[("dates.start",1)]',
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [],
                                    must_not: [
                                        {term: {state: WORKFLOW_STATE.SPIKED}},
                                    ],
                                },
                            },
                            filter: {range: {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}}},
                        }),
                    })]);

                    done();
                })
        ));

        it('by list of ids', (done) => {
            store.test(done, eventsApi.query({ids: ['e1', 'e2'], onlyFuture: false}))
                .then(() => {
                    expect(services.api('events').query.callCount).toBe(1);
                    expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                        page: 1,
                        max_results: 25,
                        sort: '[("dates.start",1)]',
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [
                                        {terms: {_id: ['e1', 'e2']}},
                                    ],
                                    must_not: [
                                        {term: {state: WORKFLOW_STATE.SPIKED}},
                                    ],
                                },
                            },
                            filter: {},
                        }),
                    })]);

                    done();
                });
        });

        it('by fulltext', (done) => (
            store.test(done, eventsApi.query({fulltext: 'Search Event*'}))
                .then(() => {
                    expect(services.api('events').query.callCount).toBe(1);
                    expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                        page: 1,
                        sort: '[("dates.start",1)]',
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [
                                        {query_string: {query: 'Search Event*'}},
                                    ],
                                    must_not: [
                                        {term: {state: WORKFLOW_STATE.SPIKED}},
                                    ],
                                },
                            },
                            filter: {range: {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}}},
                        }),
                    })]);

                    done();
                })
        ));

        it('by recurrence_id', (done) => {
            store.test(done, eventsApi.query({recurrenceId: 'rec1', onlyFuture: false}))
                .then(() => {
                    expect(services.api('events').query.callCount).toBe(1);
                    expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                        page: 1,
                        sort: '[("dates.start",1)]',
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [
                                        {term: {recurrence_id: 'rec1'}},
                                    ],
                                    must_not: [
                                        {term: {state: WORKFLOW_STATE.SPIKED}},
                                    ],
                                },
                            },
                            filter: {},
                        }),
                    })]);

                    done();
                });
        });

        describe('advancedSearch', () => {
            it('by calendars', (done) => (
                store.test(done, eventsApi.query({calendars: ['sport', 'finance']}))
                    .then(() => {
                        expect(services.api('events').query.callCount).toBe(1);
                        expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                            page: 1,
                            max_results: 25,
                            sort: '[("dates.start",1)]',
                            source: JSON.stringify({
                                query: {
                                    bool: {
                                        must: [
                                            {terms: {'calendars.qcode': ['sport', 'finance']}},
                                        ],
                                        must_not: [
                                            {term: {state: WORKFLOW_STATE.SPIKED}},
                                        ],
                                    },
                                },
                                filter: {range: {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}}},
                            }),
                        })]);

                        done();
                    })
            ));

            it('by single calendar', (done) => (
                store.test(done, eventsApi.query({calendars: ['sport']}))
                    .then(() => {
                        expect(services.api('events').query.callCount).toBe(1);
                        expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                            page: 1,
                            max_results: 25,
                            sort: '[("dates.start",1)]',
                            source: JSON.stringify({
                                query: {
                                    bool: {
                                        must: [
                                            {term: {'calendars.qcode': 'sport'}},
                                        ],
                                        must_not: [
                                            {term: {state: WORKFLOW_STATE.SPIKED}},
                                        ],
                                    },
                                },
                                filter: {range: {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}}},
                            }),
                        })]);

                        done();
                    })
            ));

            it('by source', (done) => (
                store.test(done, eventsApi.query({
                    advancedSearch: {
                        source: [{
                            id: 'ingest123',
                            name: 'AFP',
                        }],
                    },
                }))
                    .then(() => {
                        expect(services.api('events').query.callCount).toBe(1);
                        expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                            page: 1,
                            max_results: 25,
                            sort: '[("dates.start",1)]',
                            source: JSON.stringify({
                                query: {
                                    bool: {
                                        must: [
                                            {terms: {source: ['AFP']}},
                                        ],
                                        must_not: [
                                            {term: {state: WORKFLOW_STATE.SPIKED}},
                                        ],
                                    },
                                },
                                filter: {range: {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}}},
                            }),
                        })]);

                        done();
                    })
            ));

            it('by workflow state', (done) => (
                store.test(done, eventsApi.query({
                    advancedSearch: {
                        state: [{
                            qcode: 'postponed',
                            name: 'postponed',
                        }, {
                            qcode: 'rescheduled',
                            name: 'rescheduled',
                        }],
                    },
                }))
                    .then(() => {
                        expect(services.api('events').query.callCount).toBe(1);
                        expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                            page: 1,
                            max_results: 25,
                            sort: '[("dates.start",1)]',
                            source: JSON.stringify({
                                query: {
                                    bool: {
                                        must: [
                                            {terms: {state: ['postponed', 'rescheduled']}},
                                        ],
                                        must_not: [
                                            {term: {state: WORKFLOW_STATE.SPIKED}},
                                        ],
                                    },
                                },
                                filter: {range: {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}}},
                            }),
                        })]);

                        done();
                    })
            ));

            it('by workflow state including spiked items', (done) => (
                store.test(done, eventsApi.query({
                    spikeState: SPIKED_STATE.BOTH,
                    advancedSearch: {
                        state: [{
                            qcode: 'postponed',
                            name: 'postponed',
                        }, {
                            qcode: 'rescheduled',
                            name: 'rescheduled',
                        }],
                    },
                }))
                    .then(() => {
                        expect(services.api('events').query.callCount).toBe(1);
                        expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                            page: 1,
                            max_results: 25,
                            sort: '[("dates.start",1)]',
                            source: JSON.stringify({
                                query: {
                                    bool: {
                                        must: [
                                            {terms: {state: ['postponed', 'rescheduled', 'spiked']}},
                                        ],
                                        must_not: [],
                                    },
                                },
                                filter: {range: {'dates.end': {gte: 'now/d', time_zone: getTimeZoneOffset()}}},
                            }),
                        })]);

                        done();
                    })
            ));
        });
    });

    describe('refetchEvents', () => {
        it('performs query', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.EVENTS;
            restoreSinonStub(eventsApi.refetch);
            restoreSinonStub(eventsApi.query);
            sinon.stub(eventsApi, 'query').callsFake(
                () => (Promise.resolve(data.events))
            );

            return store.test(done, eventsApi.refetch())
                .then((events) => {
                    expect(events).toEqual(data.events);
                    expect(eventsApi.query.callCount).toBe(1);
                    expect(eventsApi.query.args[0]).toEqual([{page: 1}, true]);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.args[0]).toEqual([data.events]);

                    done();
                });
        });
    });

    describe('fetchEventHistory', () => {
        it('calls events_history api and runs dispatch', (done) => {
            store.test(done, eventsApi.fetchEventHistory('e2'))
                .then((data) => {
                    expect(data._items).toEqual(store.data.events_history);
                    expect(store.dispatch.callCount).toBe(1);

                    expect(store.services.api('events_history').query.callCount).toBe(1);
                    expect(store.services.api('events_history').query.args[0]).toEqual([{
                        where: {event_id: 'e2'},
                        max_results: 200,
                        sort: '[(\'_created\', 1)]',
                    }]);

                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'RECEIVE_EVENT_HISTORY',
                        payload: store.data.events_history,
                    }]);
                    done();
                });
        });
    });

    describe('loadRecurringEventsAndPlanningItems', () => {
        beforeEach(() => {
            data.events[0].recurrence_id = 'rec1';
        });

        it('loadRecurringEventsAndPlanningItems for single event and no planning items', (done) => {
            delete data.events[0].recurrence_id;
            store.test(done, eventsApi.loadRecurringEventsAndPlanningItems(data.events[0], false))
                .then((data) => {
                    expect(data).toEqual({
                        events: [],
                        plannings: [],
                    });
                    done();
                });
        });

        it('loads events and planning items', (done) => {
            store.test(done, eventsApi.loadRecurringEventsAndPlanningItems(data.events[0]))
                .then((events) => {
                    expect(events).toEqual({
                        events: data.events,
                        plannings: [
                            data.plannings[0],
                            data.plannings[1],
                        ],
                    });

                    expect(eventsApi.loadEventsByRecurrenceId.callCount).toBe(1);
                    expect(eventsApi.loadEventsByRecurrenceId.args[0]).toEqual([
                        'rec1',
                        'both',
                        1,
                        200,
                        false,
                    ]);

                    expect(planningApi.loadPlanningByRecurrenceId.callCount).toBe(1);
                    expect(planningApi.loadPlanningByRecurrenceId.args[0]).toEqual([
                        'rec1',
                        false,
                    ]);

                    done();
                });
        });

        it('returns Promise.reject if failed to load event series', (done) => {
            restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
            sinon.stub(eventsApi, 'loadEventsByRecurrenceId').callsFake(
                () => (Promise.reject(errorMessage))
            );

            return store.test(done, eventsApi.loadRecurringEventsAndPlanningItems(data.events[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });

        it('returns Promise.reject if failed to load planning items', (done) => {
            restoreSinonStub(planningApi.loadPlanningByRecurrenceId);
            sinon.stub(planningApi, 'loadPlanningByRecurrenceId').callsFake(
                () => (Promise.reject(errorMessage))
            );

            return store.test(done, eventsApi.loadRecurringEventsAndPlanningItems(data.events[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    it('receiveEvents', () => {
        restoreSinonStub(eventsApi.receiveEvents);
        expect(eventsApi.receiveEvents(data.events)).toEqual(jasmine.objectContaining({
            type: 'ADD_EVENTS',
            payload: data.events,
        }));
    });

    describe('rescheduleEvent', () => {
        it('can reschedule an event', (done) => {
            data.events[1].reason = 'Changing the day';
            store.test(done, eventsApi.rescheduleEvent(data.events[1]))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_reschedule',
                        data.events[1],
                        {
                            update_method: 'single',
                            dates: data.events[1].dates,
                            reason: 'Changing the day',
                        },
                    ]);

                    done();
                });
        });

        it('can send `future` when rescheduling', (done) => {
            data.events[1].reason = 'Changing the day';
            data.events[1].update_method = {value: 'future'};
            store.test(done, eventsApi.rescheduleEvent(data.events[1]))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_reschedule',
                        data.events[1],
                        {
                            update_method: 'future',
                            dates: data.events[1].dates,
                            reason: 'Changing the day',
                        },
                    ]);

                    done();
                });
        });

        it('returns Promise.reject if `events_reschedule` fails', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject(errorMessage)));
            store.test(done, eventsApi.rescheduleEvent(data.events[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    describe('loadAssociatedPlannings', () => {
        it('returns if no associated Planning items', (done) => (
            store.test(done, eventsApi.loadAssociatedPlannings(data.events[1]))
                .then((items) => {
                    expect(items).toEqual([]);
                    expect(planningApi.loadPlanningByEventId.callCount).toBe(0);

                    done();
                })
        ));

        it('loads associated Planning items', (done) => (
            store.test(done, eventsApi.loadAssociatedPlannings(data.events[0]))
                .then((items) => {
                    expect(items).toEqual(data.plannings);
                    expect(planningApi.loadPlanningByEventId.callCount).toBe(1);
                    expect(planningApi.loadPlanningByEventId.args[0]).toEqual([data.events[0]._id]);

                    done();
                })
        ));
    });

    describe('queryLockedEvents', () => {
        it('queries Events api for locked events', (done) => (
            store.test(done, eventsApi.queryLockedEvents())
                .then(() => {
                    const query = {constant_score: {filter: {exists: {field: 'lock_session'}}}};

                    expect(services.api('events').query.callCount).toBe(1);
                    expect(services.api('events').query.args[0]).toEqual([
                        {source: JSON.stringify({query})},
                    ]);
                    done();
                })
        ));

        it('returns reject is lock query fails', (done) => {
            services.api('events').query = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, eventsApi.queryLockedEvents())
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    describe('getEvent', () => {
        it('returns the Event if it is already in the store', (done) => (
            store.test(done, eventsApi.getEvent(data.events[0]._id))
                .then((event) => {
                    expect(event).toEqual({
                        ...data.events[0],
                        dates: {
                            ...data.events[0].dates,
                            start: moment(data.events[0].dates.start),
                            end: moment(data.events[0].dates.end),
                        },
                    });
                    expect(services.api('events').getById.callCount).toBe(0);

                    done();
                })
        ));

        it('loads the Event if it is not in the store', (done) => {
            store.init();
            store.initialState.events.events = {};
            store.test(done, eventsApi.getEvent(data.events[0]._id))
                .then((event) => {
                    expect(event).toEqual({
                        ...data.events[0],
                        dates: {
                            ...data.events[0].dates,
                            start: moment(data.events[0].dates.start),
                            end: moment(data.events[0].dates.end),
                        },
                    });
                    expect(services.api('events').getById.callCount).toBe(1);
                    expect(services.api('events').getById.args[0]).toEqual([data.events[0]._id]);

                    done();
                });
        });

        it('returns Promise.reject if getById fails', (done) => {
            store.init();
            store.initialState.events.events = {};
            services.api('events').getById = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, eventsApi.getEvent(data.events[0]._id))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    done();
                });
        });
    });

    it('post calls `events_post` endpoint', (done) => (
        store.test(done, eventsApi.post(data.events[0]))
            .then(() => {
                expect(services.api.save.callCount).toBe(1);
                expect(services.api.save.args[0]).toEqual([
                    'events_post',
                    {
                        event: data.events[0]._id,
                        etag: data.events[0]._etag,
                        pubstatus: 'usable',
                        update_method: 'single',
                    },
                ]);
                done();
            })
    ));

    it('unpost calls `events_post` endpoint', (done) => (
        store.test(done, eventsApi.unpost(data.events[0]))
            .then(() => {
                expect(services.api.save.callCount).toBe(1);
                expect(services.api.save.args[0]).toEqual([
                    'events_post',
                    {
                        event: data.events[0]._id,
                        etag: data.events[0]._etag,
                        pubstatus: 'cancelled',
                        update_method: 'single',
                    },
                ]);
                done();
            })
    ));

    describe('_uploadFiles', () => {
        it('uploads files', (done) => {
            data.events[0].files = [['test_file_1'], ['test_file_2']];
            store.test(done, eventsApi._uploadFiles(data.events[0]))
                .then((files) => {
                    expect(services.upload.start.callCount).toBe(2);
                    expect(services.upload.start.args[0]).toEqual([{
                        method: 'POST',
                        url: 'http://server.com/events_files/',
                        headers: {'Content-Type': 'multipart/form-data'},
                        data: {media: [data.events[0].files[0]]},
                        arrayKey: '',
                    }]);
                    expect(services.upload.start.args[1]).toEqual([{
                        method: 'POST',
                        url: 'http://server.com/events_files/',
                        headers: {'Content-Type': 'multipart/form-data'},
                        data: {media: [data.events[0].files[1]]},
                        arrayKey: '',
                    }]);

                    expect(files).toEqual([
                        {_id: 'test_file_1'},
                        {_id: 'test_file_2'},
                    ]);
                    done();
                });
        });

        it('returns Promise.reject if any upload fails', (done) => {
            data.events[0].files = [['test_file_1'], ['test_file_2']];
            services.upload.start = sinon.stub().returns(Promise.reject(errorMessage));
            store.test(done, eventsApi._uploadFiles(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });

        it('returns if event has no files', (done) => (
            store.test(done, eventsApi._uploadFiles(data.events[0]))
                .then((files) => {
                    expect(files).toEqual([]);
                    expect(services.upload.start.callCount).toBe(0);
                    done();
                })
        ));

        it('returns if no files to upload', (done) => {
            data.events[0].files = [{_id: 'test_file_1'}, {_id: 'test_file_2'}];
            store.test(done, eventsApi._uploadFiles(data.events[0]))
                .then((files) => {
                    expect(files).toEqual([]);
                    expect(services.upload.start.callCount).toBe(0);
                    done();
                });
        });

        it('only uploads new files', (done) => {
            data.events[0].files = [['test_file_1'], {_id: 'test_file_2'}];
            store.test(done, eventsApi._uploadFiles(data.events[0]))
                .then((files) => {
                    expect(services.upload.start.callCount).toBe(1);
                    expect(services.upload.start.args[0]).toEqual([{
                        method: 'POST',
                        url: 'http://server.com/events_files/',
                        headers: {'Content-Type': 'multipart/form-data'},
                        data: {media: [data.events[0].files[0]]},
                        arrayKey: '',
                    }]);

                    expect(files).toEqual([{_id: 'test_file_1'}]);
                    done();
                });
        });
    });

    describe('duplicate', () => {
        let apiSave;

        beforeEach(() => {
            services.api = sinon.spy((resource, item) => ({save: apiSave}));
        });

        xit('duplicate calls `events_duplicate` endpoint', (done) => {
            apiSave = sinon.spy((args) => Promise.resolve(data.events[0]));
            store.test(done, eventsApi.duplicate(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(services.api.callCount).toBe(1);
                    expect(services.api.args[0]).toEqual(['events_duplicate', data.events[0]]);

                    expect(apiSave.callCount).toBe(1);
                    expect(apiSave.args[0]).toEqual([{}]);

                    done();
                });
        });

        xit('duplicate returns Promise.reject on error', (done) => {
            apiSave = sinon.spy((args) => Promise.reject(errorMessage));
            store.test(done, eventsApi.duplicate(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    it('updateRepetitions', (done) => (
        store.test(done, eventsApi.updateRepetitions(data.events[0]))
            .then(() => {
                expect(services.api.update.callCount).toBe(1);
                expect(services.api.update.args[0]).toEqual([
                    'events_update_repetitions',
                    data.events[0],
                    {dates: data.events[0].dates},
                ]);

                done();
            })
    ));

    describe('save', () => {
        beforeEach(() => {
            let apiSave = sinon.spy((args) => Promise.resolve({_items: [data.events[0]]}));

            sinon.stub(eventsApi, 'fetchById').callsFake(() => Promise.resolve(data.events[0]));
            services.api = sinon.spy((resource, item) => ({save: apiSave}));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.fetchById);
            restoreSinonStub(eventsApi._uploadFiles);
            restoreSinonStub(eventsApi._saveLocation);
            restoreSinonStub(eventsApi._save);
        });

        it('returns Promise.reject is _uploadFiles fails', (done) => {
            sinon.stub(eventsApi, '_uploadFiles').callsFake(() => Promise.reject('Upload Files Failed'));
            sinon.stub(eventsApi, '_saveLocation').callsFake(() => Promise.resolve());
            sinon.stub(eventsApi, '_save').callsFake(() => Promise.resolve());
            store.test(done, eventsApi.save(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual('Upload Files Failed');

                    expect(eventsApi._uploadFiles.callCount).toBe(1);
                    expect(eventsApi._saveLocation.callCount).toBe(1);
                    expect(eventsApi._save.callCount).toBe(0);

                    done();
                });
        });

        it('returns Promise.reject is _saveLocation fails', (done) => {
            sinon.stub(eventsApi, '_uploadFiles').callsFake(() => Promise.resolve());
            sinon.stub(eventsApi, '_saveLocation').callsFake(() => Promise.reject('Save Location Failed'));
            sinon.stub(eventsApi, '_save').callsFake(() => Promise.resolve());
            store.test(done, eventsApi.save(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual('Save Location Failed');

                    expect(eventsApi._uploadFiles.callCount).toBe(1);
                    expect(eventsApi._saveLocation.callCount).toBe(1);
                    expect(eventsApi._save.callCount).toBe(0);

                    done();
                });
        });

        it('runs _save with files/location information', (done) => {
            sinon.stub(eventsApi, '_uploadFiles').callsFake(() => Promise.resolve([{_id: 'file2', name: 'File 2'}]));
            sinon.stub(eventsApi, '_saveLocation').callsFake((item) => Promise.resolve(item));
            sinon.stub(eventsApi, '_save').callsFake((item) => Promise.resolve(item));

            store.test(done, eventsApi.save({
                ...data.events[0],
                files: [{_id: 'file1', name: 'File 1'}],
            }))
                .then((item) => {
                    expect(item).toEqual({
                        ...data.events[0],
                        files: ['file1', 'file2'],
                    });

                    expect(eventsApi._uploadFiles.callCount).toBe(1);
                    expect(eventsApi._saveLocation.callCount).toBe(1);
                    expect(eventsApi._save.callCount).toBe(1);
                    expect(eventsApi._save.args[0]).toEqual([{
                        ...data.events[0],
                        files: ['file1', 'file2'],
                    }]);

                    done();
                });
        });

        it('_save calls api.save', (done) => (
            store.test(done, eventsApi._save({
                _id: data.events[0]._id,
                name: 'New Name',
                slugline: 'New Slugline',
            }))
                .then((item) => {
                    expect(item).toEqual([data.events[0]]);

                    expect(eventsApi.fetchById.callCount).toBe(1);
                    expect(eventsApi.fetchById.args[0]).toEqual([
                        data.events[0]._id,
                        {saveToStore: false, loadPlanning: false},
                    ]);

                    expect(services.api('events').save.callCount).toBe(1);
                    expect(services.api('events').save.args[0]).toEqual([
                        {
                            ...data.events[0],
                            location: null,
                        },
                        {
                            name: 'New Name',
                            slugline: 'New Slugline',
                            update_method: 'single',
                        },
                    ]);

                    done();
                })
        ));

        it('doesnt call event.api.fetchById if it is a new Event', (done) => (
            store.test(done, eventsApi._save({name: 'New Event', slugline: 'New Slugline'}))
                .then(() => {
                    expect(eventsApi.fetchById.callCount).toBe(0);

                    expect(services.api('events').save.callCount).toBe(1);
                    expect(services.api('events').save.args[0]).toEqual([
                        {location: null},
                        {
                            name: 'New Event',
                            slugline: 'New Slugline',
                            update_method: 'single',
                        },
                    ]);

                    done();
                })
        ));
    });

    describe('events.api.fetchCalendars', () => {
        it('fetchCalendars sends RECEIVE_CALENDARS dispatch', (done) => (
            store.test(done, eventsApi.fetchCalendars())
                .then((calendars) => {
                    expect(calendars).toEqual([
                        {
                            name: 'Sport',
                            qcode: 'sport',
                            is_active: true,
                        },
                        {
                            name: 'Finance',
                            qcode: 'finance',
                            is_active: false,
                        },
                        {
                            name: 'Entertainment',
                            qcode: 'entertainment',
                            is_active: true,
                        },
                    ]);

                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'RECEIVE_CALENDARS',
                        payload: [
                            {
                                name: 'Sport',
                                qcode: 'sport',
                                is_active: true,
                            },
                            {
                                name: 'Finance',
                                qcode: 'finance',
                                is_active: false,
                            },
                            {
                                name: 'Entertainment',
                                qcode: 'entertainment',
                                is_active: true,
                            },
                        ],
                    }]);

                    done();
                })
        ));

        it('fetchCalendars returns Promise.reject if an error occurs', (done) => {
            services.vocabularies.getVocabularies = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, eventsApi.fetchCalendars())
                .then(null, (error) => {
                    expect(error).toBe(errorMessage);
                    done();
                });
        });
    });
});
