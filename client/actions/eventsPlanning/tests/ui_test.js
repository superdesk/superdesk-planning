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

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        sinon.stub(eventsPlanningApi, 'query').callsFake(
            () => Promise.resolve(store.data.planning_search)
        );
        sinon.stub(eventsPlanningApi, 'refetch').callsFake(
            () => Promise.resolve(store.data.planning_search)
        );
        sinon.stub(eventsApi, 'loadAssociatedPlannings').callsFake(
            () => Promise.resolve(store.data.plannings)
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
                expect(store.dispatch.callCount).toBe(6);

                expect(store.dispatch.args[0][0]).toEqual(
                    {
                        type: MAIN.ACTIONS.REQUEST,
                        payload: {COMBINED: {}}}
                );

                expect(store.dispatch.args[3][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS.ACTIONS.ADD_EVENTS,
                            payload: data.events
                        }
                    )
                );

                expect(store.dispatch.args[4][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                            payload: data.plannings
                        }
                    )
                );

                expect(store.dispatch.args[5][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
                            payload: data.planning_search
                        }
                    )
                );

                expect(services.$timeout.callCount).toBe(1);
                expect(services.$location.search.callCount).toBe(1);
                expect(services.$location.search.args[0]).toEqual(['searchParams', '{}']);

                done();
            })
    ));

    it('load more', (done) => {
        store.initialState.main.search.COMBINED.lastRequestParams = {page: 2};
        store.initialState.main.filter = MAIN.FILTERS.COMBINED;

        store.test(done, eventsPlanningUi.loadMore())
            .then(() => {
                expect(eventsPlanningApi.query.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(6);

                expect(store.dispatch.args[0][0]).toEqual(
                    {
                        type: MAIN.ACTIONS.REQUEST,
                        payload: {COMBINED: {page: 3}}}
                );

                expect(store.dispatch.args[3][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS.ACTIONS.ADD_EVENTS,
                            payload: data.events
                        }
                    )
                );

                expect(store.dispatch.args[4][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                            payload: data.plannings
                        }
                    )
                );

                expect(store.dispatch.args[5][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS_PLANNING.ACTIONS.ADD_EVENTS_PLANNING_LIST,
                            payload: data.planning_search
                        }
                    )
                );

                done();
            });
    });


    it('refetch', (done) => {
        store.initialState.main.search.COMBINED.lastRequestParams = {page: 2};
        store.initialState.main.filter = MAIN.FILTERS.COMBINED;

        store.test(done, eventsPlanningUi.refetch())
            .then(() => {
                expect(eventsPlanningApi.refetch.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(5);

                expect(store.dispatch.args[2][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS.ACTIONS.ADD_EVENTS,
                            payload: data.events
                        }
                    )
                );

                expect(store.dispatch.args[3][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                            payload: data.plannings
                        }
                    )
                );

                expect(store.dispatch.args[4][0]).toEqual(
                    jasmine.objectContaining(
                        {
                            type: EVENTS_PLANNING.ACTIONS.SET_EVENTS_PLANNING_LIST,
                            payload: data.planning_search
                        }
                    )
                );

                done();
            });
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
                            payload: event
                        }
                    )
                );

                done();
            });
    });
});