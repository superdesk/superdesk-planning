import eventsApi from '../api';
import planningApi from '../../planning/api';
import sinon from 'sinon';
import {EventUpdateMethods} from '../../../components/fields';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {WORKFLOW_STATE, SPIKED_STATE} from '../../../constants';
import moment from 'moment';

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
        sinon.stub(eventsApi, 'refetchEvents').callsFake(() => (Promise.resolve()));
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
        restoreSinonStub(eventsApi.refetchEvents);
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
                }]);

                expect(eventsApi.receiveEvents.callCount).toBe(1);
                expect(eventsApi.receiveEvents.args[0]).toEqual([data.events]);

                done();
            });
    });

    describe('loadEventsByRecurrenceId', () => {
        beforeEach(() => {
            restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
        });

        it('runs the query', (done) => (
            store.test(done, eventsApi.loadEventsByRecurrenceId('r1', SPIKED_STATE.NOT_SPIKED))
                .then((items) => {
                    expect(items).toEqual(data.events);

                    expect(eventsApi.query.callCount).toBe(1);
                    expect(eventsApi.query.args[0]).toEqual([{
                        recurrenceId: 'r1',
                        spikeState: SPIKED_STATE.NOT_SPIKED,
                        page: 1,
                        maxResults: 25,
                    }]);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.args[0]).toEqual([data.events]);

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
                        {},
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
                            {},
                        ]);
                    }

                    done();
                })
        ));

        it('returns Promise.reject if `events_unspike` fails', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject(errorMessage)));
            return store.test(done, eventsApi.unspike(data.events))
                .then(() => { /* no-op */ }, (error) => {
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
                        embedded: {files: 1},
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [],
                                    must_not: [
                                        {term: {state: WORKFLOW_STATE.SPIKED}},
                                    ],
                                },
                            },
                            filter: {range: {'dates.end': {gte: 'now/d'}}},
                        }),
                    })]);

                    done();
                })
        ));

        it('by list of ids', (done) => {
            store.test(done, eventsApi.query({ids: ['e1', 'e2']}))
                .then(() => {
                    expect(services.api('events').query.callCount).toBe(1);
                    expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                        page: 1,
                        sort: '[("dates.start",1)]',
                        embedded: {files: 1},
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
                        embedded: {files: 1},
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
                            filter: {},
                        }),
                    })]);

                    done();
                })
        ));

        it('by recurrence_id', (done) => {
            store.test(done, eventsApi.query({recurrenceId: 'rec1'}))
                .then(() => {
                    expect(services.api('events').query.callCount).toBe(1);
                    expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                        page: 1,
                        sort: '[("dates.start",1)]',
                        embedded: {files: 1},
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
                store.test(done, eventsApi.query({
                    advancedSearch: {
                        calendars: [{
                            qcode: 'sport',
                            name: 'Sport',
                        }, {
                            qcode: 'finance',
                            name: 'Finance',
                        }],
                    },
                }))
                    .then(() => {
                        expect(services.api('events').query.callCount).toBe(1);
                        expect(services.api('events').query.args[0]).toEqual([jasmine.objectContaining({
                            page: 1,
                            sort: '[("dates.start",1)]',
                            embedded: {files: 1},
                            source: JSON.stringify({
                                query: {
                                    bool: {
                                        must: [
                                            {term: {'calendars.qcode': 'sport'}},
                                            {term: {'calendars.qcode': 'finance'}},
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
                    })
            ));
        });
    });

    describe('refetchEvents', () => {
        it('performs query', (done) => {
            restoreSinonStub(eventsApi.refetchEvents);
            restoreSinonStub(eventsApi.query);
            sinon.stub(eventsApi, 'query').callsFake(
                () => (Promise.resolve({_items: data.events}))
            );

            return store.test(done, eventsApi.refetchEvents())
                .then((events) => {
                    expect(events).toEqual(data.events);
                    expect(eventsApi.query.callCount).toBe(1);
                    expect(eventsApi.query.args[0]).toEqual([{page: 1}]);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.args[0]).toEqual([data.events]);

                    done();
                });
        });
    });

    describe('fetchEventHistory', () => {
        fit('calls events_history api and runs dispatch', (done) => {
            const apiSpy = { };

            store.test(done, eventsApi.fetchEventHistory('e2'))
            .then((data) => {
                expect(data._items).toEqual(store.data.events_history);
                console.log('here')
                expect(apiSpy.query.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(1);

                expect(services.api('events_history').query.args[0]).toEqual([{
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

    it('publishEvent calls `events_publish` endpoint', (done) => (
        store.test(done, eventsApi.publishEvent(data.events[0]))
            .then(() => {
                expect(services.api.save.callCount).toBe(1);
                expect(services.api.save.args[0]).toEqual([
                    'events_publish',
                    {
                        event: data.events[0]._id,
                        etag: data.events[0]._etag,
                        pubstatus: 'usable',
                    },
                ]);
                done();
            })
    ));
});
