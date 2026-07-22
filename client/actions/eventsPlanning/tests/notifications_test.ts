import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {registerNotifications} from '../../../utils';
import notifications from '../notifications';
import eventsPlanningUi from '../ui';
import {MAIN} from '../../../constants';
import {planningApi} from '../../../superdeskApi';


describe('actions.eventsplanning.notifications', () => {
    let store;
    let data;
    let services;

    beforeEach(() => {
        store = getTestActionStore();
        data = store.data;
        services = store.services;
        store.init();
    });

    describe('websocket', () => {
        const delay = 0;
        let $rootScope;

        beforeEach(inject((_$rootScope_) => {
            sinon.stub(notifications, 'onEventPlaningFilterCreatedOrUpdated').callsFake(
                () => (Promise.resolve())
            );

            sinon.stub(notifications, 'onEventPlaningFilterDeleted').callsFake(
                () => (Promise.resolve())
            );

            $rootScope = _$rootScope_;
            registerNotifications($rootScope, store);
            $rootScope.$digest();
        }));

        afterEach(() => {
            restoreSinonStub(notifications.onEventPlaningFilterCreatedOrUpdated);
            restoreSinonStub(notifications.onEventPlaningFilterDeleted);
        });

        it('on filter created', (done) => {
            $rootScope.$broadcast('event_planning_filters:created', {item: 'finance', user: 'user1'});

            setTimeout(() => {
                expect(notifications.onEventPlaningFilterCreatedOrUpdated.callCount).toBe(1);
                expect(notifications.onEventPlaningFilterCreatedOrUpdated.args[0][1]).toEqual(
                    {item: 'finance', user: 'user1'}
                );
                done();
            }, delay);
        });

        it('on filter updated', (done) => {
            $rootScope.$broadcast('event_planning_filters:updated', {item: 'finance', user: 'user1'});

            setTimeout(() => {
                expect(notifications.onEventPlaningFilterCreatedOrUpdated.callCount).toBe(1);
                expect(notifications.onEventPlaningFilterCreatedOrUpdated.args[0][1]).toEqual(
                    {item: 'finance', user: 'user1'}
                );
                done();
            }, delay);
        });

        it('on filter deleted', (done) => {
            $rootScope.$broadcast('event_planning_filters:deleted', {item: 'finance', user: 'user1'});

            setTimeout(() => {
                expect(notifications.onEventPlaningFilterDeleted.callCount).toBe(1);
                expect(notifications.onEventPlaningFilterDeleted.args[0][1]).toEqual(
                    {item: 'finance', user: 'user1'}
                );
                done();
            }, delay);
        });
    });


    describe('on filter create', () => {
        beforeEach(() => {
            sinon.stub(planningApi.ui.list, 'updateSearchAndReloadList').callsFake(() => (Promise.resolve({})));
            sinon.stub(eventsPlanningUi, 'fetchFilterById').callsFake(
                () => Promise.resolve(data.events_planning_filters[0])
            );
            sinon.stub(eventsPlanningUi, 'fetchFilters').callsFake(
                () => Promise.resolve([])
            );
        });

        afterEach(() => {
            restoreSinonStub(eventsPlanningUi.fetchFilterById);
            restoreSinonStub(planningApi.ui.list.updateSearchAndReloadList);
            restoreSinonStub(eventsPlanningUi.fetchFilters);
        });

        it('create new filter', (done) => {
            store.test(done, notifications.onEventPlaningFilterCreatedOrUpdated({}, {item: 'finance', user: 'user1'}))
                .then(() => {
                    expect(eventsPlanningUi.fetchFilterById.callCount).toBe(1);
                    expect(planningApi.ui.list.updateSearchAndReloadList.callCount).toBe(0);
                    expect(services.notify.warning.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
        });

        it('update filter', (done) => {
            store.initialState.eventsPlanning.currentFilter = 'finance';
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;
            store.test(done, notifications.onEventPlaningFilterCreatedOrUpdated({}, {item: 'finance', user: 'user1'}))
                .then(() => {
                    expect(eventsPlanningUi.fetchFilterById.callCount).toBe(1);

                    expect(planningApi.ui.list.updateSearchAndReloadList.callCount).toBe(1);
                    expect(planningApi.ui.list.updateSearchAndReloadList.args[0][0]).toEqual({filter_id: 'finance'});

                    expect(services.notify.warning.callCount).toBe(1);
                    expect(services.notify.warning.args[0][0]).toEqual(
                        'The Event and Planning filter you were viewing is modified!'
                    );
                    done();
                })
                .catch(done.fail);
        });

        it('delete filter with current filter different', (done) => {
            store.initialState.eventsPlanning.currentFilter = 'xxx';
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;
            store.test(done, notifications.onEventPlaningFilterDeleted({}, {item: 'finance', user: 'user1'}))
                .then(() => {
                    expect(eventsPlanningUi.fetchFilters.callCount).toBe(1);
                    expect(planningApi.ui.list.updateSearchAndReloadList.callCount).toBe(0);
                    expect(services.notify.warning.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
        });

        it('delete filter with current filter different', (done) => {
            store.initialState.eventsPlanning.currentFilter = 'finance';
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;
            store.test(done, notifications.onEventPlaningFilterDeleted({}, {item: 'finance', user: 'user1'}))
                .then(() => {
                    expect(eventsPlanningUi.fetchFilters.callCount).toBe(1);

                    expect(planningApi.ui.list.updateSearchAndReloadList.callCount).toBe(1);
                    expect(planningApi.ui.list.updateSearchAndReloadList.args[0][0]).toEqual({filter_id: null});

                    expect(services.notify.warning.callCount).toBe(1);
                    expect(services.notify.warning.args[0][0]).toEqual(
                        'The Event and Planning filter you were viewing is deleted!'
                    );
                    done();
                })
                .catch(done.fail);
        });
    });
});
