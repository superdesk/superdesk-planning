import eventsPlanningApi from '../api';
import eventsPlanningUi from '../ui';
import eventsApi from '../../events/api';
import planningApi from '../../planning/api';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {PLANNING, EVENTS, EVENTS_PLANNING, MAIN} from '../../../constants';
import {planningApis} from '../../../api';
import {appConfig} from 'appConfig';

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

    describe('loadAllRelatedPlannings', () => {
        const relatedPlannings = [
            {_id: 'p10', type: 'planning', event_item: 'e1', slugline: 'RelatedPlan1'},
            {_id: 'p11', type: 'planning', event_item: 'e1', slugline: 'RelatedPlan2'},
        ];

        beforeEach(() => {
            sinon.stub(planningApis.planning, 'getByEventIds').callsFake(
                () => Promise.resolve(relatedPlannings)
            );
            sinon.stub(planningApi, 'receivePlannings').callsFake(
                () => ({type: PLANNING.ACTIONS.RECEIVE_PLANNINGS, payload: relatedPlannings})
            );
        });

        afterEach(() => {
            restoreSinonStub(planningApis.planning.getByEventIds);
            restoreSinonStub(planningApi.receivePlannings);
        });

        it('fetches related plannings for events with planning_ids', (done) => {
            const items = [
                {_id: 'e1', type: 'event', planning_ids: ['p10', 'p11']},
                {_id: 'e2', type: 'event', planning_ids: []},
                {_id: 'p1', type: 'planning', slugline: 'Plan1'},
            ];

            store.test(done, eventsPlanningUi.loadAllRelatedPlannings(items))
                .then(() => {
                    expect(planningApis.planning.getByEventIds.callCount).toBe(1);
                    expect(planningApis.planning.getByEventIds.args[0][0]).toEqual(['e1']);

                    expect(planningApi.receivePlannings.callCount).toBe(1);
                    expect(planningApi.receivePlannings.args[0][0]).toEqual(relatedPlannings);

                    done();
                })
                .catch(done.fail);
        });

        it('dispatches _showRelatedPlannings for each event with plannings', (done) => {
            const items = [
                {_id: 'e1', type: 'event', planning_ids: ['p10']},
                {_id: 'e2', type: 'event', planning_ids: ['p11']},
            ];

            store.test(done, eventsPlanningUi.loadAllRelatedPlannings(items))
                .then(() => {
                    const showRelatedDispatches = store.dispatch.args.filter(
                        (args) => args[0]?.type === EVENTS_PLANNING.ACTIONS.SHOW_RELATED_PLANNINGS
                    );

                    expect(showRelatedDispatches.length).toBe(2);
                    expect(showRelatedDispatches[0][0].payload._id).toBe('e1');
                    expect(showRelatedDispatches[1][0].payload._id).toBe('e2');

                    done();
                })
                .catch(done.fail);
        });

        it('resolves immediately when no events have planning_ids', (done) => {
            const items = [
                {_id: 'e1', type: 'event', planning_ids: []},
                {_id: 'p1', type: 'planning', slugline: 'Plan1'},
            ];

            store.test(done, eventsPlanningUi.loadAllRelatedPlannings(items))
                .then(() => {
                    expect(planningApis.planning.getByEventIds.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
        });

        it('skips planning items in the input', (done) => {
            const items = [
                {_id: 'p1', type: 'planning', slugline: 'Plan1'},
                {_id: 'p2', type: 'planning', slugline: 'Plan2'},
            ];

            store.test(done, eventsPlanningUi.loadAllRelatedPlannings(items))
                .then(() => {
                    expect(planningApis.planning.getByEventIds.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('receiveEventsPlanning with planning_expand_related_plannings', () => {
        let originalExpandSetting;

        beforeEach(() => {
            originalExpandSetting = appConfig.planning_expand_related_plannings;
            sinon.stub(planningApis.planning, 'getByEventIds').callsFake(
                () => Promise.resolve([])
            );
            sinon.stub(planningApi, 'receivePlannings').callsFake(
                (items) => ({type: PLANNING.ACTIONS.RECEIVE_PLANNINGS, payload: items})
            );
        });

        afterEach(() => {
            appConfig.planning_expand_related_plannings = originalExpandSetting;
            restoreSinonStub(planningApis.planning.getByEventIds);
            restoreSinonStub(planningApi.receivePlannings);
        });

        it('calls loadAllRelatedPlannings when config is true', (done) => {
            appConfig.planning_expand_related_plannings = true;

            const items = [
                {_id: 'e1', type: 'event', planning_ids: ['p10']},
            ];

            store.test(done, eventsPlanningUi.receiveEventsPlanning(items))
                .then(() => {
                    expect(planningApis.planning.getByEventIds.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });

        it('does not call loadAllRelatedPlannings when config is false', (done) => {
            appConfig.planning_expand_related_plannings = false;

            const items = [
                {_id: 'e1', type: 'event', planning_ids: ['p10']},
            ];

            store.test(done, eventsPlanningUi.receiveEventsPlanning(items))
                .then(() => {
                    expect(planningApis.planning.getByEventIds.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
        });
    });
});
