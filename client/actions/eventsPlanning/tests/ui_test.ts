import eventsPlanningApi from '../api';
import eventsPlanningUi from '../ui';
import eventsApi from '../../events/api';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {PLANNING, EVENTS, EVENTS_PLANNING, MAIN} from '../../../constants';

describe('actions.eventsplanning.ui', () => {
    let store;
    let services;
    let data;
    let api;
    let payload = Array.from(Array(MAIN.PAGE_SIZE).keys());

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;
        api = store.spies.api;

        sinon.stub(eventsPlanningApi, 'query').callsFake(
            () => Promise.resolve(payload)
        );
        sinon.stub(eventsPlanningApi, 'refetch').callsFake(
            () => Promise.resolve(data.planning_search)
        );
        sinon.stub(eventsApi, 'loadAssociatedPlannings').callsFake(
            () => Promise.resolve(data.plannings)
        );
    });

    afterEach(() => {
        restoreSinonStub(eventsPlanningApi.query);
        restoreSinonStub(eventsPlanningApi.refetch);
        restoreSinonStub(eventsApi.loadAssociatedPlannings);
    });

    it('fetch data', (done) => (
        store.test(done, eventsPlanningUi.fetch({}))
            .then(() => {
                expect(eventsPlanningApi.query.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(8);
                expect(store.dispatch.args[0][0]).toEqual(
                    {
                        type: MAIN.ACTIONS.REQUEST,
                        payload: {COMBINED: {}},
                    }
                );

                expect(store.dispatch.args[3][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS.ACTIONS.ADD_EVENTS,
                            payload: [],
                        }
                    )
                );

                expect(store.dispatch.args[6][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                            payload: [],
                        }
                    )
                );

                expect(store.dispatch.args[7][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
                            payload: payload,
                        }
                    )
                );

                expect(services.$timeout.callCount).toBe(1);
                expect(services.$location.search.callCount).toBe(1);
                expect(services.$location.search.args[0]).toEqual(['searchParams', '{}']);

                done();
            })
    ).catch(done.fail));

    it('load more and fetch data equal to page size', (done) => {
        store.initialState.main.search.COMBINED.lastRequestParams = {page: 2};
        store.initialState.main.search.COMBINED.totalItems = 50;
        store.initialState.main.filter = MAIN.FILTERS.COMBINED;

        store.test(done, eventsPlanningUi.loadMore())
            .then(() => {
                expect(eventsPlanningApi.query.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(8);

                expect(store.dispatch.args[1][0]).toEqual(
                    {
                        type: MAIN.ACTIONS.REQUEST,
                        payload: {COMBINED: {page: 3}}}
                );

                expect(store.dispatch.args[3][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS.ACTIONS.ADD_EVENTS,
                            payload: [],
                        }
                    )
                );

                expect(store.dispatch.args[6][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                            payload: [],
                        }
                    )
                );

                expect(store.dispatch.args[7][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST,
                            payload: payload,
                        }
                    )
                );

                done();
            })
            .catch(done.fail);
    });

    describe('load more', () => {
        beforeEach(() => {
            restoreSinonStub(eventsPlanningApi.query);
            sinon.stub(eventsPlanningApi, 'query').callsFake(
                () => Promise.resolve(store.data.planning_search)
            );
        });

        afterEach(() => {
            restoreSinonStub(eventsPlanningApi.query);
        });

        it('load more and fetch data less than page size', (done) => {
            store.initialState.main.search.COMBINED.lastRequestParams = {page: 2};
            store.initialState.main.search.COMBINED.totalItems = 35;
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;

            store.test(done, eventsPlanningUi.loadMore())
                .then(() => {
                    expect(eventsPlanningApi.query.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(7);

                    expect(store.dispatch.args[2][0]).toEqual(
                        jasmine.objectContaining(
                            {
                                type: EVENTS.ACTIONS.ADD_EVENTS,
                                payload: data.events,
                            }
                        )
                    );

                    expect(store.dispatch.args[5][0]).toEqual(
                        jasmine.objectContaining(
                            {
                                type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                                payload: data.plannings,
                            }
                        )
                    );

                    expect(store.dispatch.args[6][0]).toEqual(
                        jasmine.objectContaining(
                            {
                                type: EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST,
                                payload: data.planning_search,
                            }
                        )
                    );

                    done();
                })
                .catch(done.fail);
        });
    });

    it('refetch', (done) => {
        store.initialState.main.search.COMBINED.lastRequestParams = {page: 2};
        store.initialState.main.filter = MAIN.FILTERS.COMBINED;

        store.test(done, eventsPlanningUi.refetch())
            .then(() => {
                expect(eventsPlanningApi.refetch.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(7);

                expect(store.dispatch.args[2][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS.ACTIONS.ADD_EVENTS,
                            payload: data.events,
                        }
                    )
                );

                expect(store.dispatch.args[5][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                            payload: data.plannings,
                        }
                    )
                );

                expect(store.dispatch.args[6][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
                            payload: data.planning_search,
                        }
                    )
                );

                done();
            })
            .catch(done.fail);
    });

    it('show related plannings', (done) => {
        const event = {_id: 'e1', planning_ids: ['p1']};

        store.test(done, eventsPlanningUi.showRelatedPlannings(event))
            .then(() => {
                expect(eventsApi.loadAssociatedPlannings.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(2);

                expect(store.dispatch.args[1][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS,
                            payload: event,
                        }
                    )
                );

                done();
            })
            .catch(done.fail);
    });

    describe('filters', () => {
        beforeEach(() => {
            sinon.stub(eventsPlanningUi, 'fetch').callsFake(() => Promise.resolve([]));
        });

        afterEach(() => {
            restoreSinonStub(eventsPlanningUi.fetch);
            // restoreSinonStub(eventsPlanningApi.saveFilter);
        });

        it('select filter', (done) => {
            store.initialState.eventsPlanning.filters = data.events_planning_filters;
            store.test(done, eventsPlanningUi.selectFilter('finance', {}))
                .then(() => {
                    expect(eventsPlanningUi.fetch.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(4);
                    expect(store.dispatch.args[0][0]).toEqual(
                        {
                            type: EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER,
                            payload: 'finance',
                        }
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('selected filter does not exist', (done) => {
            store.initialState.eventsPlanning.filters = data.events_planning_filters;
            store.test(done, eventsPlanningUi.selectFilter('foo', {}))
                .then(() => {
                    expect(eventsPlanningUi.fetch.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(5);
                    expect(store.dispatch.args[1][0]).toEqual(
                        {
                            type: EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER,
                            payload: EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING,
                        }
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('fetch all filters', (done) => {
            store.test(done, eventsPlanningUi.fetchFilters())
                .then(() => {
                    expect(api.events_planning_filters.getAll.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0][0]).toEqual(
                        {
                            type: EVENTS_PLANNING.ACTIONS.RECEIVE_EVENTS_PLANNING_FILTERS,
                            payload: data.events_planning_filters,
                        }
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('fetch by id', (done) => {
            store.test(done, eventsPlanningUi.fetchFilterById('finance'))
                .then(() => {
                    expect(api.events_planning_filters.getById.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0][0]).toEqual(
                        {
                            type: EVENTS_PLANNING.ACTIONS.ADD_OR_REPLACE_EVENTS_PLANNING_FILTER,
                            payload: data.events_planning_filters[0],
                        }
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('new filter', (done) => {
            const newFilter = {
                name: 'foo',
                calendars: [{name: 'finance', qcode: 'finance'}],
            };

            store.test(done, eventsPlanningUi.saveFilter(newFilter))
                .then(() => {
                    expect(api.events_planning_filters.save.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(1);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0][0]).toEqual(
                        'The Events and Planning view filter is created.'
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('update filter', (done) => {
            const newFilter = {
                _id: 'foo',
                name: 'foo',
                calendars: [{name: 'finance', qcode: 'finance'}],
            };

            store.initialState.eventsPlanning.filters = [
                {
                    _id: 'foo',
                    name: 'foo2',
                    calendars: [{name: 'finance', qcode: 'finance'}],
                },
            ];
            store.test(done, eventsPlanningUi.saveFilter(newFilter))
                .then(() => {
                    expect(api.events_planning_filters.save.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(1);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0][0]).toEqual(
                        'The Events and Planning view filter is updated.'
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('save filter failed', (done) => {
            const newFilter = {
                name: 'foo',
                calendars: [{name: 'finance', qcode: 'finance'}],
            };

            api.events_planning_filters.save = sinon.spy(() => (Promise.reject()));
            store.test(done, eventsPlanningUi.saveFilter(newFilter))
                .then(() => { /* no-op */ }, () => {
                    expect(api.events_planning_filters.save.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(1);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0][0]).toEqual(
                        'Failed to create/update Events and Planning view filter'
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('delete filter', (done) => {
            const filter = {
                _id: 'finance',
                name: 'finance',
                calendars: [{name: 'finance', qcode: 'finance'}],
            };

            store.test(done, eventsPlanningUi.deleteFilter(filter))
                .then(() => {
                    expect(api.events_planning_filters.remove.callCount).toBe(1);
                    expect(store.dispatch.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0][0]).toEqual(
                        'The Events and Planning view filter is deleted.'
                    );
                    done();
                })
                .catch(done.fail);
        });
    });
});
