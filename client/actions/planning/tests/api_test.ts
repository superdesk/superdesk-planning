import planningApi from '../api';
import sinon from 'sinon';
import {cloneDeep} from 'lodash';
import {
    getTestActionStore,
    restoreSinonStub,
    convertEventDatesToMoment,
} from '../../../utils/testUtils';
import {createTestStore} from '../../../utils';
import {PLANNING, SPIKED_STATE, WORKFLOW_STATE} from '../../../constants';
import {MAIN} from '../../../constants';
import * as selectors from '../../../selectors';
import contactsApi from '../../contacts';
import {planningApis} from '../../../api';

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

        sinon.stub(planningApis.planning, 'search').callsFake(
            () => Promise.resolve({_items: data.plannings})
        );
        sinon.stub(planningApis.planning, 'getById').callsFake(
            () => Promise.resolve(data.plannings[0])
        );
        sinon.stub(planningApis.events, 'search').callsFake(
            () => Promise.resolve({_items: data.events})
        );
        sinon.stub(planningApis.events, 'getByIds').callsFake(
            () => Promise.resolve(data.events)
        );
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
        restoreSinonStub(planningApis.planning.search);
        restoreSinonStub(planningApis.planning.getById);
        restoreSinonStub(planningApis.events.search);
        restoreSinonStub(planningApis.events.getByIds);
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
        ).catch(done.fail));

        it('api.spike returns Promise.reject on error', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject('Failed!')));
            return store.test(done, planningApi.spike(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');
                    done();
                })
                .catch(done.fail);
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
        ).catch(done.fail));

        it('api.unspike returns Promise.reject on error', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject('Failed!')));
            return store.test(done, planningApi.unspike(data.plannings[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('query', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.query);
        });

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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });

        it('returns Promise.reject on query error', (done) => {
            restoreSinonStub(planningApis.planning.search);
            sinon.stub(planningApis.planning, 'search').returns(Promise.reject('Failed!'));
            return store.test(done, planningApi.fetch())
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');
                    expect(planningApi.query.callCount).toBe(1);
                    expect(planningApi.fetchPlanningsEvents.callCount).toBe(0);

                    expect(planningApi.receivePlannings.callCount).toBe(1);
                    expect(planningApi.receivePlannings.args[0]).toEqual([[]]);
                    done();
                })
                .catch(done.fail);
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
        ).catch(done.fail));

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
                    expect(planningApis.events.getByIds.callCount).toBe(1);
                    expect(planningApis.events.getByIds.args[0]).toEqual([
                        ['e1'],
                        'both',
                    ]);

                    done();
                })
        ).catch(done.fail));
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

                    expect(planningApis.planning.getById.callCount).toBe(1);
                    expect(planningApis.planning.getById.args[0]).toEqual([
                        'p1',
                        true,
                        false,
                    ]);

                    expect(planningApi.fetchPlanningsEvents.callCount).toBe(1);
                    expect(planningApi.fetchPlanningsEvents.args[0]).toEqual([
                        [data.plannings[0]],
                    ]);

                    done();
                })
        ).catch(done.fail));

        it('fetches using force=true', (done) => (
            store.test(done, planningApi.fetchById('p1', {force: true}))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(planningApis.planning.getById.callCount).toBe(1);
                    expect(planningApis.planning.getById.args[0]).toEqual([
                        'p1',
                        true,
                        true,
                    ]);

                    expect(planningApi.fetchPlanningsEvents.callCount).toBe(1);
                    expect(planningApi.fetchPlanningsEvents.args[0]).toEqual([
                        [data.plannings[0]],
                    ]);

                    done();
                })
        ).catch(done.fail));

        it('returns Promise.reject on error', (done) => {
            restoreSinonStub(planningApis.planning.getById);
            sinon.stub(planningApis.planning, 'getById').returns(Promise.reject(errorMessage));
            store.test(done, planningApi.fetchById('p1', {force: true}))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
        });

        it('returns store instance when already loaded', (done) => (
            store.test(done, planningApi.fetchById('p1'))
                .then((item) => {
                    expect(item).toEqual(data.plannings[0]);

                    expect(planningApis.planning.getById.callCount).toBe(1);
                    expect(planningApi.receivePlannings.callCount).toBe(0);

                    done();
                })
        ).catch(done.fail));
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

            return store.test(done, planningApi.save(null, planningItem))
                .then((item) => {
                    expect(item).toEqual(jasmine.objectContaining({...planningItem}));

                    expect(planningApi.fetchById.callCount).toBe(0);

                    expect(services.api('planning').save.callCount).toBe(1);
                    expect(services.api('planning').save.args[0]).toEqual([
                        {},
                        planningItem,
                    ]);

                    done();
                })
                .catch(done.fail);
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

            return store.test(done, planningApi.save(null, planningItem))
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
                        {add_to_planning: false},
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('saves existing item', (done) => {
            let planningItem;

            sinon.stub(planningApi, 'fetchById').callsFake((id) => (Promise.resolve(
                store.initialState.planning.plannings[id]
            )));

            return store.test(done, () => {
                planningItem = cloneDeep(data.plannings[0]);
                planningItem.slugline = 'New Slugger';
                return store.dispatch(planningApi.save(null, planningItem));
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
                })
                .catch(done.fail);
        });

        it('returns Promise.reject on fetchById error', (done) => {
            sinon.stub(planningApi, 'fetchById').callsFake(
                () => (Promise.reject('Failed!'))
            );

            return store.test(done, planningApi.save(null, {_id: 'p3'}))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toBe('Failed!');

                    expect(planningApi.fetchById.callCount).toBe(1);
                    expect(services.api('planning').save.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });
    });

    describe('receivePlannings', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.receivePlannings);
            sinon.stub(contactsApi, 'fetchContactsFromPlanning').returns(Promise.resolve([]));
        });

        afterEach(() => {
            restoreSinonStub(contactsApi.fetchContactsFromPlanning);
        });

        it('adds the planning items to the store', () => {
            store.dispatch(planningApi.receivePlannings(data.plannings));

            expect(store.dispatch.callCount).toBe(3);
            expect(store.dispatch.args[2][0]).toEqual({
                type: PLANNING.ACTIONS.RECEIVE_PLANNINGS,
                payload: data.plannings,
            });
        });

        it('loads contacts from received planning items', () => {
            const items = [
                {coverages: [{assigned_to: {contact: 'con1'}}]},
                {coverages: [{assigned_to: {contact: 'con2'}}]},
                {coverages: [{assigned_to: {user: 'ident1'}}]},
                {coverages: [{assigned_to: {}}]},
            ];

            store.dispatch(planningApi.receivePlannings(items));
            expect(contactsApi.fetchContactsFromPlanning.callCount).toBe(1);
            expect(contactsApi.fetchContactsFromPlanning.args[0]).toEqual([items]);
        });
    });

    describe('fetchPlanningHistory', () => {
        beforeEach(() => {
            restoreSinonStub(planningApi.fetchPlanningHistory);
        });

        it('calls planning_history api and runs dispatch', (done) => (
            store.test(done, planningApi.fetchPlanningHistory('p2'))
                .then((items) => {
                    expect(items).toEqual(data.planning_history);
                    expect(services.api('planning_history').query.callCount).toBe(1);
                    expect(services.api('planning_history').query.args[0]).toEqual([{
                        where: {planning_id: 'p2'},
                        max_results: 200,
                        sort: '[(\'_created\', 1)]',
                    }]);
                    done();
                })
        ).catch(done.fail));

        it('returns Promise.reject is planning_history query fails', (done) => {
            services.api('planning_history').query = sinon.spy(
                () => (Promise.reject(errorMessage))
            );

            return store.test(done, planningApi.fetchPlanningHistory('p2'))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });

        it('api.post returns Promise.reject on error', (done) => {
            restoreSinonStub(planningApi.post);
            services.api.save = sinon.stub().returns(Promise.reject(errorMessage));
            store.test(done, planningApi.post(data.plannings[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
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
            })
            .catch(done.fail);
    });

    describe('getPlanning', () => {
        it('returns the Planning if it is already in the store', (done) => (
            store.test(done, planningApi.getPlanning(data.plannings[1]._id))
                .then((plan) => {
                    expect(plan).toEqual(data.plannings[1]);
                    expect(services.api('planning').getById.callCount).toBe(0);

                    done();
                })
        ).catch(done.fail));

        it('loads the Planning if it is not in the store', (done) => {
            store.init();
            store.initialState.planning.plannings = {};
            store.test(done, planningApi.getPlanning(data.plannings[0]._id))
                .then((plan) => {
                    expect(plan).toEqual(data.plannings[0]);
                    expect(planningApis.planning.getById.callCount).toBe(1);
                    expect(planningApis.planning.getById.args[0]).toEqual([data.plannings[0]._id]);

                    done();
                })
                .catch(done.fail);
        });

        it('returns Promise.reject if getById fails', (done) => {
            store.init();
            store.initialState.planning.plannings = {};
            restoreSinonStub(planningApis.planning.getById);
            sinon.stub(planningApis.planning, 'getById').returns(Promise.reject(errorMessage));
            store.test(done, planningApi.getPlanning(data.plannings[1]._id))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('loadPlanningByRecurrenceId', () => {
        it('queries the api for planning items by recurrence_id', (done) => (
            store.test(done, planningApi.loadPlanningByRecurrenceId('rec1'))
                .then(() => {
                    expect(planningApis.planning.search.callCount).toBe(1);
                    expect(planningApis.planning.search.args[0]).toEqual([{
                        recurrence_id: 'rec1',
                        only_future: false,
                    }]);

                    done();
                })
        ).catch(done.fail));

        it('returns Promise.reject if recurrence_id query fails', (done) => {
            restoreSinonStub(planningApis.planning.search);
            sinon.stub(planningApis.planning, 'search').returns(Promise.reject(errorMessage));
            store.test(done, planningApi.loadPlanningByRecurrenceId('rec1'))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });

        it('duplicate returns Promise.reject on error', (done) => {
            apiSave = sinon.spy((args) => Promise.reject(errorMessage));
            store.test(done, planningApi.duplicate(data.plannings[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('lock/unlock', () => {
        let mockStore;
        let mocks;
        let getLocks = () => selectors.locks.getLockedItems(mockStore.getState());

        beforeEach(() => {
            mocks = {
                api: sinon.spy(() => mocks),
                save: sinon.spy((original, updates = {}) => Promise.resolve({
                    ...data.plannings[0],
                    ...updates,
                })),
            };

            store.init();
        });

        it('calls lock endpoint and updates the redux store', (done) => {
            mockStore = createTestStore({
                initialState: store.initialState,
                extraArguments: {
                    api: mocks.api,
                },
            });

            expect(getLocks().planning).toEqual({});

            mockStore.dispatch(planningApi.lock(data.plannings[0]))
                .then(() => {
                    expect(mocks.api.callCount).toBe(1);
                    expect(mocks.api.args[0]).toEqual([
                        'planning_lock',
                        data.plannings[0],
                    ]);

                    expect(mocks.save.callCount).toBe(1);
                    expect(mocks.save.args[0]).toEqual([
                        {},
                        {lock_action: 'edit'},
                    ]);

                    expect(getLocks().planning).toEqual({
                        p1: jasmine.objectContaining({
                            action: 'edit',
                            item_type: 'planning',
                            item_id: 'p1',
                        }),
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('calls unlock endpoint and updates the redux store', (done) => {
            store.initialState.locks.planning = {
                p1: {
                    action: 'edit',
                    item_type: 'planning',
                    item_id: 'p1',
                },
            };

            mockStore = createTestStore({
                initialState: store.initialState,
                extraArguments: {
                    api: mocks.api,
                },
            });

            expect(getLocks().planning).toEqual({
                p1: jasmine.objectContaining({
                    action: 'edit',
                    item_type: 'planning',
                    item_id: 'p1',
                }),
            });

            mockStore.dispatch(planningApi.unlock(data.plannings[0]))
                .then(() => {
                    expect(mocks.api.callCount).toBe(1);
                    expect(mocks.api.args[0]).toEqual([
                        'planning_unlock',
                        data.plannings[0],
                    ]);

                    expect(mocks.save.callCount).toBe(1);
                    expect(mocks.save.args[0]).toEqual([{}]);

                    expect(getLocks().planning).toEqual({});

                    done();
                })
                .catch(done.fail);
        });
    });
});
