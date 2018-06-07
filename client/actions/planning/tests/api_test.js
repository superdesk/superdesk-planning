import planningApi from '../api';
import sinon from 'sinon';
import {cloneDeep} from 'lodash';
import {
    getTestActionStore,
    restoreSinonStub,
    convertEventDatesToMoment,
} from '../../../utils/testUtils';
import {getTimeZoneOffset} from '../../../utils/index';
import {SPIKED_STATE} from '../../../constants/index';
import {MAIN} from '../../../constants';

describe('actions.planning.api', () => {
    let errorMessage;
    let store;
    let services;
    let data;

    beforeEach(() => {
        errorMessage = {data: {_message: ''}};
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        sinon.stub(planningApi, 'save').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve([])));
        sinon.stub(planningApi, 'query').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'receivePlannings').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'fetchPlanningsEvents').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'fetchById').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'fetchPlanningHistory').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'post').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'unpost').callsFake(() => (Promise.resolve()));
    });

    afterEach(() => {
        restoreSinonStub(planningApi.save);
        restoreSinonStub(planningApi.fetch);
        restoreSinonStub(planningApi.query);
        restoreSinonStub(planningApi.receivePlannings);
        restoreSinonStub(planningApi.fetchPlanningsEvents);
        restoreSinonStub(planningApi.fetchById);
        restoreSinonStub(planningApi.fetchPlanningHistory);
        restoreSinonStub(planningApi.post);
        restoreSinonStub(planningApi.unpost);
    });

    describe('spike', () => {
        it('api.spike calls `planning_spike` endpoint', (done) => (
            store.test(done, planningApi.spike(data.plannings[1]))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'planning_spike',
                        data.plannings[1],
                        {},
                    ]);

                    done();
                })
        ));

        it('api.spike returns Promise.reject on error', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject('Failed!')));
            return store.test(done, planningApi.spike(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');
                    done();
                });
        });
    });

    describe('unspike', () => {
        it('api.unspike calls `planning_unspike` endpoint', (done) => (
            store.test(done, planningApi.unspike(data.plannings[1]))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'planning_unspike',
                        data.plannings[1],
                        {},
                    ]);

                    done();
                })
        ));

        it('api.unspike returns Promise.reject on error', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject('Failed!')));
            return store.test(done, planningApi.unspike(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');
                    done();
                });
        });
    });

    describe('query', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.query);
        });

        it('list planning items of agendas', (done) => (
            store.test(done, planningApi.query({agendas: ['a1', 'a2']}
            ))
                .then(() => {
                    expect(services.api('planning').query.callCount).toBe(1);
                    const source = JSON.parse(services.api('planning').query.args[0][0].source);

                    expect(source.query.bool.must).toEqual([{terms: {agendas: ['a1', 'a2']}}]);
                    expect(source.filter).toEqual(
                        {
                            nested: {
                                path: '_planning_schedule',
                                filter: {
                                    range: {
                                        '_planning_schedule.scheduled': {
                                            gte: 'now/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                            },
                        }
                    );
                    expect(source.query.bool.must_not).toEqual([]);
                    expect(source.sort).toEqual(
                        [
                            {
                                '_planning_schedule.scheduled': {
                                    order: 'asc',
                                    nested_path: '_planning_schedule',
                                    nested_filter: {
                                        range: {
                                            '_planning_schedule.scheduled': {
                                                gte: 'now/d',
                                                time_zone: getTimeZoneOffset(),
                                            },
                                        },
                                    },
                                },
                            },
                        ]
                    );
                    done();
                })
        ));

        it('by list of planning not in any agendas', (done) => (
            store.test(done, planningApi.query({
                noAgendaAssigned: true,
            }))
                .then(() => {
                    let noAgenda = {constant_score: {filter: {exists: {field: 'agendas'}}}};

                    expect(services.api('planning').query.callCount).toBe(1);
                    const source = JSON.parse(services.api('planning').query.args[0][0].source);

                    expect(source.filter).toEqual(
                        {
                            nested: {
                                path: '_planning_schedule',
                                filter: {
                                    range: {
                                        '_planning_schedule.scheduled': {
                                            gte: 'now/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                            },
                        }
                    );

                    expect(source.query.bool.must_not).toEqual([noAgenda]);

                    done();
                })
        ));

        it('by spiked item state', (done) => (
            store.test(done, planningApi.query({
                agendas: ['a1', 'a2'],
                spikeState: SPIKED_STATE.SPIKED,
            }))
                .then(() => {
                    expect(services.api('planning').query.callCount).toBe(1);
                    const source = JSON.parse(services.api('planning').query.args[0][0].source);

                    expect(source.filter).toEqual(
                        {
                            nested: {
                                path: '_planning_schedule',
                                filter: {
                                    range: {
                                        '_planning_schedule.scheduled': {
                                            gte: 'now/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                            },
                        }
                    );

                    expect(source.query.bool.must).toEqual([
                        {terms: {agendas: ['a1', 'a2']}},
                        {term: {state: 'spiked'}},
                    ]);

                    expect(source.query.bool.must_not).toEqual([]);
                    done();
                })
        ));

        it('by non-spiked item state', (done) => (
            store.test(done, planningApi.query({
                agendas: ['a1', 'a2'],
                spikeState: SPIKED_STATE.NOT_SPIKED,
            }))
                .then(() => {
                    expect(services.api('planning').query.callCount).toBe(1);
                    const source = JSON.parse(services.api('planning').query.args[0][0].source);

                    expect(source.filter).toEqual(
                        {
                            nested: {
                                path: '_planning_schedule',
                                filter: {
                                    range: {
                                        '_planning_schedule.scheduled': {
                                            gte: 'now/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                            },
                        }
                    );

                    expect(source.query.bool.must).toEqual([
                        {terms: {agendas: ['a1', 'a2']}},
                    ]);

                    expect(source.query.bool.must_not).toEqual([{term: {state: 'spiked'}}]);

                    done();
                })
        ));

        it('by workflow-state in advancedSearch', (done) => (
            store.test(done, planningApi.query({
                agendas: ['a1', 'a2'],
                spikeState: SPIKED_STATE.NOT_SPIKED,
                advancedSearch: {
                    state: [{
                        qcode: 'draft',
                        name: 'draft',
                    }, {
                        qcode: 'postponed',
                        name: 'postponed',
                    }]},
            }))
                .then(() => {
                    expect(services.api('planning').query.callCount).toBe(1);
                    const source = JSON.parse(services.api('planning').query.args[0][0].source);

                    expect(source.filter).toEqual(
                        {
                            nested: {
                                path: '_planning_schedule',
                                filter: {
                                    range: {
                                        '_planning_schedule.scheduled': {
                                            gte: 'now/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                            },
                        }
                    );

                    expect(source.query.bool.must).toEqual([
                        {terms: {agendas: ['a1', 'a2']}},
                        {terms: {state: ['draft', 'postponed']}},
                    ]);

                    expect(source.query.bool.must_not).toEqual([{term: {state: 'spiked'}}]);

                    done();
                })
        ));

        it('by workflow-state in advancedSearch including spiked', (done) => (
            store.test(done, planningApi.query({
                agendas: ['a1', 'a2'],
                spikeState: SPIKED_STATE.BOTH,
                advancedSearch: {
                    state: [{
                        qcode: 'draft',
                        name: 'draft',
                    }, {
                        qcode: 'postponed',
                        name: 'postponed',
                    }]},
            }))
                .then(() => {
                    expect(services.api('planning').query.callCount).toBe(1);
                    const source = JSON.parse(services.api('planning').query.args[0][0].source);

                    expect(source.filter).toEqual(
                        {
                            nested: {
                                path: '_planning_schedule',
                                filter: {
                                    range: {
                                        '_planning_schedule.scheduled': {
                                            gte: 'now/d',
                                            time_zone: getTimeZoneOffset(),
                                        },
                                    },
                                },
                            },
                        }
                    );

                    expect(source.query.bool.must).toEqual([
                        {terms: {agendas: ['a1', 'a2']}},
                        {terms: {state: ['draft', 'postponed', 'spiked']}},
                    ]);

                    expect(source.query.bool.must_not).toEqual([]);

                    done();
                })
        ));

        it('refetch', (done) => {
            sinon.stub(planningApi, 'query').callsFake(() => (Promise.resolve(['item'])));
            store.initialState.main.filter = MAIN.FILTERS.PLANNING;
            store.initialState.main.search.PLANNING.lastRequestParams.page = 3;

            store.test(done, planningApi.refetch())
                .then((items) => {
                    expect(planningApi.query.callCount).toBe(3);
                    expect(items.length).toBe(3);
                    expect(items).toEqual(['item', 'item', 'item']);
                    done();
                });
        });
    });

    describe('fetch', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetch);
            restoreSinonStub(planningApi.query);
            sinon.spy(planningApi, 'query');
        });

        it('fetches planning items and linked events', (done) => {
            const params = {
                agendas: ['a1'],
                spikeState: SPIKED_STATE.NOT_SPIKED,
            };

            return store.test(done, planningApi.fetch(params))
                .then((items) => {
                    expect(planningApi.query.callCount).toBe(1);
                    expect(planningApi.query.args[0]).toEqual([params, true]);

                    expect(planningApi.fetchPlanningsEvents.callCount).toBe(1);
                    expect(planningApi.fetchPlanningsEvents.args[0]).toEqual([data.plannings]);

                    expect(planningApi.receivePlannings.callCount).toBe(1);
                    expect(planningApi.receivePlannings.args[0]).toEqual([data.plannings]);

                    expect(data.plannings).toEqual(items);
                    done();
                });
        });

        it('returns Promise.reject on query error', (done) => {
            services.api('planning').query = sinon.spy(() => (Promise.reject('Failed!')));
            return store.test(done, planningApi.fetch())
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');
                    expect(planningApi.query.callCount).toBe(1);
                    expect(planningApi.fetchPlanningsEvents.callCount).toBe(0);

                    expect(planningApi.receivePlannings.callCount).toBe(1);
                    expect(planningApi.receivePlannings.args[0]).toEqual([[]]);
                    done();
                });
        });
    });

    describe('fetchPlanningsEvents', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetchPlanningsEvents);
        });

        it('returns if no linked events', (done) => (
            store.test(done, planningApi.fetchPlanningsEvents(data.plannings))
                .then((items) => {
                // When actions.events has been upgraded to use named exports like planning
                // Then we can mock actions.events.silentlyFetchEventsById
                // and check the callCount & args of that function
                    expect(items).toEqual([]);

                    // The API should not have been called
                    expect(services.api('events').query.callCount).toBe(0);

                    done();
                })
        ));

        it('fetches and returns linked events', (done) => (
            // Run store.test() first to construct initialValues
            store.test(done, () => {
                // Then remove events from the store, so that fetchPlanningsEvents
                // fetches the events from the mocked API
                store.initialState.events.events = {};
                return store.dispatch(planningApi.fetchPlanningsEvents(data.plannings));
            })
                .then((items) => {
                    expect(items).toEqual(convertEventDatesToMoment(data.events));

                    // The API should have been called
                    expect(services.api('events').query.callCount).toBe(1);
                    expect(services.api('events').query.args[0]).toEqual([{
                        page: 1,
                        max_results: 25,
                        sort: '[("dates.start",1)]',
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [
                                        {terms: {_id: ['e1']}},
                                    ],
                                    must_not: [],
                                },
                            },
                            filter: {},
                        }),
                    }]);

                    done();
                })
        ));
    });

    describe('fetchById', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetchById);
        });

        it('fetches using planning id', (done) => (
            store.test(done, () => {
                store.initialState.planning.plannings = {};
                return store.dispatch(planningApi.fetchById('p1'));
            })
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(services.api('planning').getById.callCount).toBe(1);
                    expect(services.api('planning').getById.args[0]).toEqual(['p1']);

                    expect(planningApi.fetchPlanningsEvents.callCount).toBe(1);
                    expect(planningApi.fetchPlanningsEvents.args[0]).toEqual([
                        [data.plannings[0]],
                    ]);

                    expect(planningApi.receivePlannings.callCount).toBe(1);
                    expect(planningApi.receivePlannings.args[0]).toEqual([
                        [data.plannings[0]],
                    ]);

                    done();
                })
        ));

        it('fetches using force=true', (done) => (
            store.test(done, planningApi.fetchById('p1', {force: true}))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(services.api('planning').getById.callCount).toBe(1);
                    expect(services.api('planning').getById.args[0]).toEqual(['p1']);

                    expect(planningApi.fetchPlanningsEvents.callCount).toBe(1);
                    expect(planningApi.fetchPlanningsEvents.args[0]).toEqual([
                        [data.plannings[0]],
                    ]);

                    expect(planningApi.receivePlannings.callCount).toBe(1);
                    expect(planningApi.receivePlannings.args[0]).toEqual([
                        [data.plannings[0]],
                    ]);

                    done();
                })
        ));

        it('returns Promise.reject on error', (done) => {
            services.api('planning').getById = sinon.spy(() => (Promise.reject(errorMessage)));
            store.test(done, planningApi.fetchById('p1', {force: true}))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });

        it('returns store instance when already loaded', (done) => (
            store.test(done, planningApi.fetchById('p1'))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(services.api('planning').getById.callCount).toBe(0);
                    expect(planningApi.fetchPlanningsEvents.callCount).toBe(1);
                    expect(planningApi.receivePlannings.callCount).toBe(0);

                    done();
                })
        ));
    });

    describe('save', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.save);
            restoreSinonStub(planningApi.fetchById);
        });

        it('creates new planning item', (done) => {
            let planningItem = {
                slugline: 'Planning3',
                coverages: [],
            };

            sinon.stub(planningApi, 'fetchById');

            return store.test(done, planningApi.save(planningItem))
                .then((item) => {
                    expect(item).toEqual(jasmine.objectContaining({...planningItem}));

                    expect(planningApi.fetchById.callCount).toBe(0);

                    expect(services.api('planning').save.callCount).toBe(1);
                    expect(services.api('planning').save.args[0]).toEqual([
                        {},
                        planningItem,
                    ]);

                    done();
                });
        });

        it('create new planning item then updates with the coverages', (done) => {
            let planningItem = {
                slugline: 'Planning3',
                coverages: [{
                    planning: {
                        ednote: 'Text coverage',
                        scheduled: '2016-10-15T13:01:11',
                        g2_content_type: 'text',
                        genre: null,
                    },
                    assigned_to: {
                        user: 'ident1',
                        desk: 'desk1',
                    },
                }],
            };

            sinon.stub(planningApi, 'fetchById');

            return store.test(done, planningApi.save(planningItem))
                .then((item) => {
                    expect(item).toEqual(jasmine.objectContaining(planningItem));

                    expect(planningApi.fetchById.callCount).toBe(0);

                    expect(services.api('planning').save.callCount).toBe(2);
                    expect(services.api('planning').save.args[0]).toEqual([
                        {},
                        {
                            slugline: 'Planning3',
                            coverages: [],
                        },
                        {add_to_planning: false},
                    ]);

                    expect(services.api('planning').save.args[1]).toEqual([
                        jasmine.objectContaining({
                            slugline: 'Planning3',
                            coverages: [],
                        }),
                        planningItem,
                    ]);

                    done();
                });
        });

        it('saves existing item', (done) => {
            let planningItem;

            sinon.stub(planningApi, 'fetchById').callsFake((id) => (Promise.resolve(
                store.initialState.planning.plannings[id]
            )));

            return store.test(done, () => {
                planningItem = cloneDeep(data.plannings[0]);
                planningItem.slugline = 'New Slugger';
                return store.dispatch(planningApi.save(planningItem));
            })
                .then((item) => {
                    expect(item).toEqual(planningItem);

                    expect(planningApi.fetchById.callCount).toBe(1);
                    expect(planningApi.fetchById.args[0]).toEqual([
                        planningItem._id,
                    ]);

                    expect(services.api('planning').save.callCount).toBe(1);
                    expect(services.api('planning').save.args[0][0]).toEqual(data.plannings[0]);
                    expect(services.api('planning').save.args[0][1].slugline).toEqual('New Slugger');
                    done();
                });
        });

        it('returns Promise.reject on fetchById error', (done) => {
            sinon.stub(planningApi, 'fetchById').callsFake(
                () => (Promise.reject('Failed!'))
            );

            return store.test(done, planningApi.save({_id: 'p3'}))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');

                    expect(planningApi.fetchById.callCount).toBe(1);
                    expect(services.api('planning').save.callCount).toBe(0);
                    done();
                });
        });

        it('returns Promise.reject on api.save error', (done) => {
            let planningItem = {
                slugline: 'Plan 3',
                headline: 'Some Plan 3',
            };

            sinon.stub(planningApi, 'fetchById').callsFake((id) => (Promise.resolve(
                store.initialState.planning.plannings[id]
            )));

            services.api('planning').save = sinon.spy(() => (Promise.reject('Failed!')));

            return store.test(done, planningApi.save(planningItem))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');

                    expect(services.api('planning').getById.callCount).toBe(0);
                    expect(services.api('planning').save.callCount).toBe(1);
                    done();
                });
        });
    });

    describe('saveAndReloadCurrentAgenda', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.save);
        });

        it('creates a new planning item and add to the Agenda', (done) => {
            const newItem = {slugline: 'Planning3'};

            sinon.stub(planningApi, 'save').callsFake(() => (Promise.resolve({
                ...newItem,
                agendas: ['a1'],
                _id: 'p3',
            })));

            store.test(done, planningApi.saveAndReloadCurrentAgenda(newItem))
                .then((item) => {
                    expect(item).toEqual({
                        ...newItem,
                        agendas: ['a1'],
                        _id: 'p3',
                    });

                    expect(planningApi.fetchById.callCount).toBe(0);

                    expect(planningApi.save.callCount).toBe(1);
                    expect(planningApi.save.args[0]).toEqual([newItem, {}]);

                    done();
                });
        });

        it('saves an existing item', (done) => {
            restoreSinonStub(planningApi.fetchById);

            sinon.stub(planningApi, 'fetchById').callsFake(() => (
                Promise.resolve(data.plannings[0]))
            );

            sinon.stub(planningApi, 'save').callsFake(() => (
                Promise.resolve(data.plannings[0]))
            );

            data.agendas[0].planning_items = ['p1', 'p2'];

            return store.test(done, planningApi.saveAndReloadCurrentAgenda(
                {
                    ...data.plannings[0],
                    headline: 'Some Planning 3',
                }
            ))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(planningApi.fetchById.callCount).toBe(1);
                    expect(planningApi.fetchById.args[0]).toEqual(
                        [data.plannings[0]._id]
                    );

                    expect(planningApi.save.callCount).toBe(1);
                    expect(planningApi.save.args[0]).toEqual([
                        {
                            ...data.plannings[0],
                            headline: 'Some Planning 3',
                        },
                        data.plannings[0],
                    ]);

                    done();
                });
        });

        it('returns Promise.reject if no Agenda is selected', (done) => {
            store.initialState.agenda.currentAgendaId = undefined;
            errorMessage.data._message = 'No Agenda is currently selected.';

            return store.test(
                done,
                planningApi.saveAndReloadCurrentAgenda({slugline: 'Planning3'})
            )
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });

        it('if current Agenda is disabled', (done) => {
            data.agendas[0].is_enabled = false;
            const newItem = {slugline: 'Planning3'};

            sinon.stub(planningApi, 'save').callsFake(() => (Promise.resolve({
                ...newItem,
                agendas: [],
                _id: 'p4',
            })));

            store.test(
                done,
                planningApi.saveAndReloadCurrentAgenda(newItem)
            )
                .then((item) => {
                    expect(item).toEqual({
                        ...newItem,
                        agendas: [],
                        _id: 'p4',
                    });


                    expect(planningApi.save.callCount).toBe(1);
                    expect(planningApi.save.args[0]).toEqual([newItem, {}]);

                    done();
                });
        });
    });

    it('receivePlannings', () => {
        restoreSinonStub(planningApi.receivePlannings);
        expect(planningApi.receivePlannings(data.plannings)).toEqual({
            type: 'RECEIVE_PLANNINGS',
            payload: data.plannings,
        });
    });

    describe('fetchPlanningHistory', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetchPlanningHistory);
        });

        it('calls planning_history api and runs dispatch', (done) => (
            store.test(done, planningApi.fetchPlanningHistory('p2'))
                .then((items) => {
                    expect(items).toEqual({_items: data.planning_history});

                    expect(services.api('planning_history').query.callCount).toBe(1);
                    expect(services.api('planning_history').query.args[0]).toEqual([{
                        where: {planning_id: 'p2'},
                        max_results: 200,
                        sort: '[(\'_created\', 1)]',
                    }]);

                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'RECEIVE_PLANNING_HISTORY',
                        payload: data.planning_history,
                    }]);

                    done();
                })
        ));

        it('returns Promise.reject is planning_history query fails', (done) => {
            services.api('planning_history').query = sinon.spy(
                () => (Promise.reject(errorMessage))
            );

            return store.test(done, planningApi.fetchPlanningHistory('p2'))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    describe('post', () => {
        it('api.post calls `planning` endpoint', (done) => {
            restoreSinonStub(planningApi.post);
            restoreSinonStub(planningApi.fetchById);
            sinon.stub(planningApi, 'fetchById').returns(Promise.resolve(data.plannings[0]));
            store.test(done, planningApi.post(data.plannings[0]))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(services.api.save.callCount).toBe(1);
                    expect(services.api.save.args[0]).toEqual([
                        'planning_post',
                        {
                            planning: data.plannings[0]._id,
                            etag: data.plannings[0]._etag,
                            pubstatus: 'usable',
                        },
                    ]);

                    done();
                });
        });

        it('api.post returns Promise.reject on error', (done) => {
            restoreSinonStub(planningApi.post);
            services.api.save = sinon.stub().returns(Promise.reject(errorMessage));
            store.test(done, planningApi.post(data.plannings[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    it('api.unpost calls `planning` endpoint', (done) => {
        restoreSinonStub(planningApi.unpost);
        store.test(done, planningApi.unpost(data.plannings[0]))
            .then(() => {
                expect(services.api.save.callCount).toBe(1);
                expect(services.api.save.args[0]).toEqual([
                    'planning_post',
                    {
                        planning: data.plannings[0]._id,
                        etag: data.plannings[0]._etag,
                        pubstatus: 'cancelled',
                    },
                ]);

                done();
            });
    });

    describe('getPlanning', () => {
        it('returns the Planning if it is already in the store', (done) => (
            store.test(done, planningApi.getPlanning(data.plannings[1]._id))
                .then((plan) => {
                    expect(plan).toEqual(data.plannings[1]);
                    expect(services.api('planning').getById.callCount).toBe(0);

                    done();
                })
        ));

        it('loads the Planning if it is not in the store', (done) => {
            store.init();
            store.initialState.planning.plannings = {};
            store.test(done, planningApi.getPlanning(data.plannings[1]._id))
                .then((plan) => {
                    expect(plan).toEqual(data.plannings[1]);
                    expect(services.api('planning').getById.callCount).toBe(1);
                    expect(services.api('planning').getById.args[0]).toEqual([data.plannings[1]._id]);

                    done();
                });
        });

        it('returns Promise.reject if getById fails', (done) => {
            store.init();
            store.initialState.planning.plannings = {};
            services.api('planning').getById = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, planningApi.getPlanning(data.plannings[1]._id))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    done();
                });
        });
    });

    describe('loadPlanningByRecurrenceId', () => {
        it('queries the api for planning items by recurrence_id', (done) => (
            store.test(done, planningApi.loadPlanningByRecurrenceId('rec1'))
                .then(() => {
                    expect(services.api('planning').query.callCount).toBe(1);
                    expect(services.api('planning').query.args[0]).toEqual([{
                        source: JSON.stringify(
                            {query: {term: {recurrence_id: 'rec1'}}}
                        ),
                    }]);

                    done();
                })
        ));

        it('returns Promise.reject if recurrence_id query fails', (done) => {
            services.api('planning').query = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, planningApi.loadPlanningByRecurrenceId('rec1'))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    describe('duplicate', () => {
        let apiSave;

        beforeEach(() => {
            services.api = sinon.spy((resource, item) => ({save: apiSave}));
        });

        it('duplicate calls `planning_duplicate` endpoint', (done) => {
            apiSave = sinon.spy((args) => Promise.resolve(data.plannings[0]));
            store.test(done, planningApi.duplicate(data.plannings[0]))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(services.api.callCount).toBe(1);
                    expect(services.api.args[0]).toEqual(['planning_duplicate', data.plannings[0]]);

                    expect(apiSave.callCount).toBe(1);
                    expect(apiSave.args[0]).toEqual([{}]);

                    done();
                });
        });

        it('duplicate returns Promise.reject on error', (done) => {
            apiSave = sinon.spy((args) => Promise.reject(errorMessage));
            store.test(done, planningApi.duplicate(data.plannings[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });
});
