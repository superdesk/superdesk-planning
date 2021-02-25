import {appConfig} from 'appConfig';

import planningApi from '../api';
import featuredPlanning from '../featuredPlanning';
import moment from 'moment';
import momentTz from 'moment-timezone';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {FEATURED_PLANNING, MAIN, TIME_COMPARISON_GRANULARITY} from '../../../constants';
import {planningApis} from '../../../api';


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
                        [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
                        [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
                        [TIME_COMPARISON_GRANULARITY.SECOND]: 0,
                    }),
                    end: date.set({
                        [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
                        [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
                        [TIME_COMPARISON_GRANULARITY.SECOND]: 0,
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

        sinon.stub(planningApis.planning, 'searchGetAll').callsFake(
            () => Promise.resolve([data.plannings[0]])
        );
    });

    afterEach(() => {
        restoreSinonStub(planningApi.query);
        restoreSinonStub(planningApis.planning.searchGetAll);
    });

    describe('loadFeaturedPlanningsData', () => {
        it('calls query with required parameters', (done) => {
            appConfig.defaultTimezone = 'Australia/Sydney';
            date = momentTz.tz(moment(data.plannings[0].planning_date), 'Australia/Sydney');
            return store.test(done, featuredPlanning.loadFeaturedPlanningsData(date))
                .then(() => {
                    expect(planningApis.planning.searchGetAll.callCount).toBe(1);
                    expect(planningApis.planning.searchGetAll.args[0]).toEqual([{
                        featured: true,
                        start_date: date,
                        date_filter: 'for_date',
                        only_future: false,
                        spike_state: 'draft',
                        exclude_rescheduled_and_cancelled: true,
                        include_scheduled_updates: true,
                        tz_offset: '+11:00'
                    }]);
                    done();
                })
                .catch(done.fail);
        });

        it('onPlanningUpdatedNotification will add an item to feature list', (done) => {
            sinon.stub(planningApi, 'fetchById').callsFake(() => (Promise.resolve(data.plannings[1])));
            sinon.stub(featuredPlanning, 'receivePlannings').callsFake(() => (Promise.resolve()));
            store.initialState.featuredPlanning.plannings[data.plannings[0]._id] = data.plannings[0];
            store.initialState.featuredPlanning.currentSearch.start_date =
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
            store.initialState.featuredPlanning.currentSearch.start_date =
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
