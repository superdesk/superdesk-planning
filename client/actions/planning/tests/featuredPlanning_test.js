import planningApi from '../api';
import featuredPlanning from '../featuredPlanning';
import moment from 'moment';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {FEATURED_PLANNING, MAIN} from '../../../constants';

describe('actions.planning.api', () => {
    let store;
    let services;
    let data;
    let date;

    beforeEach(() => {
        store = getTestActionStore();

        // Set data
        data = store.data;
        data.plannings[0].featured = true;
        data.plannings[1].featured = true;
        data.plannings[1].event = undefined;
        date = moment(data.plannings[0].planning_date);
        store.initialState.featuredPlanning.inUse = true;
        store.initialState.featuredPlanning.currentSearch = {
            advancedSearch: {
                dates: {
                    start: date.set({
                        hour: 0,
                        minute: 0,
                        second: 0,
                    }),
                    end: date.set({
                        hour: 0,
                        minute: 0,
                        second: 0,
                    }),
                },
                featured: true,
            },
            page: 1,
            spikeState: 'draft',
        };

        services = store.services;
        services.api.find = sinon.spy((url, id) => Promise.resolve(data.plannings[0]));

        sinon.stub(planningApi, 'query').callsFake(() => (Promise.resolve({
            _items: [data.plannings[0]],
            total: 1,
        })));
    });

    afterEach(() => {
        restoreSinonStub(planningApi.query);
    });

    describe('loadFeaturedPlanningsData', () => {
        it('calls query with required parameters', (done) => (
            store.test(done, featuredPlanning.loadFeaturedPlanningsData(date))
                .then(() => {
                    expect(planningApi.query.callCount).toBe(1);
                    expect(planningApi.query.args[0]).toEqual([
                        {
                            advancedSearch: {
                                dates: {
                                    start: moment(date).set({
                                        hour: 0,
                                        minute: 0,
                                        second: 0,
                                    }),
                                    range: MAIN.DATE_RANGE.FOR_DATE,
                                },
                                featured: true,
                            },
                            page: 1,
                            spikeState: 'draft',
                        },
                        false,
                    ]);
                    done();
                })
        ).catch(done.fail));

        it('calls planning_featured end point to get the featured record for the day', (done) => (
            store.test(done, featuredPlanning.getFeaturedPlanningItem(date))
                .then(() => {
                    expect(services.api.find.callCount).toBe(1);
                    expect(services.api.find.args[0][0]).toEqual('planning_featured');
                    done();
                })
        ).catch(done.fail));

        it('onPlanningUpdatedNotification will add an item to feature list', (done) => {
            sinon.stub(planningApi, 'fetchById').callsFake(() => (Promise.resolve(data.plannings[1])));
            sinon.stub(featuredPlanning, 'receivePlannings').callsFake(() => (Promise.resolve()));
            store.initialState.featuredPlanning.plannings[data.plannings[0]._id] = data.plannings[0];
            store.initialState.featuredPlanning.currentSearch.advancedSearch.dates.start =
                moment(data.plannings[1].coverages[0].planning.scheduled);

            return store.test(done, featuredPlanning.onPlanningUpdatedNotification(data.plannings[1]._id))
                .then(() => {
                    expect(featuredPlanning.receivePlannings.callCount).toBe(1);
                    expect(featuredPlanning.receivePlannings.args[0][0]).toEqual([
                        data.plannings[0],
                        data.plannings[1],
                    ]);

                    restoreSinonStub(featuredPlanning.receivePlannings);
                    restoreSinonStub(planningApi.fetchById);
                    done();
                })
                .catch(done.fail);
        });

        it('onPlanningUpdatedNotification will remove an item from feature list', (done) => {
            sinon.stub(planningApi, 'fetchById').callsFake(() => (Promise.resolve({
                ...data.plannings[0],
                featured: false,
            })));
            store.initialState.featuredPlanning.plannings[data.plannings[0]._id] = data.plannings[0];
            store.initialState.featuredPlanning.currentSearch.advancedSearch.dates.start =
                moment(data.plannings[0].coverages[0].planning.scheduled);

            return store.test(done, featuredPlanning.onPlanningUpdatedNotification(data.plannings[0]._id))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(2);
                    expect(store.dispatch.args[1][0]).toEqual(
                        {
                            type: FEATURED_PLANNING.ACTIONS.REMOVE_PLANNING,
                            payload: data.plannings[0]._id,
                        }
                    );

                    restoreSinonStub(planningApi.fetchById);
                    done();
                })
                .catch(done.fail);
        });
    });
});
