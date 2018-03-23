import planningApi from '../api';
import planningUi from '../ui';
import eventsPlanningUi from '../../eventsPlanning/ui';
import eventsApi from '../../events/api';
import main from '../../main';
import sinon from 'sinon';
import {registerNotifications} from '../../../utils';
import planningNotifications from '../notifications';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {MAIN, PLANNING} from '../../../constants';

describe('actions.planning.notifications', () => {
    let store;
    let data;

    beforeEach(() => {
        store = getTestActionStore();
        data = store.data;
        store.init();
    });

    describe('websocket', () => {
        const delay = 0;
        let $rootScope;

        beforeEach(inject((_$rootScope_) => {
            sinon.stub(planningNotifications, 'onPlanningCreated').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(planningNotifications, 'onPlanningUpdated').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(planningNotifications, 'onPlanningLocked').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(planningNotifications, 'onPlanningUnlocked').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(planningNotifications, 'onPlanningPublished').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(planningNotifications, 'onPlanningSpiked').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(planningNotifications, 'onPlanningUnspiked').callsFake(
                () => (Promise.resolve())
            );

            $rootScope = _$rootScope_;
            registerNotifications($rootScope, store);
            $rootScope.$digest();
        }));

        afterEach(() => {
            restoreSinonStub(planningNotifications.onPlanningCreated);
            restoreSinonStub(planningNotifications.onPlanningUpdated);
            restoreSinonStub(planningNotifications.onPlanningLocked);
            restoreSinonStub(planningNotifications.onPlanningUnlocked);
            restoreSinonStub(planningNotifications.onPlanningPublished);
            restoreSinonStub(planningNotifications.onPlanningSpiked);
            restoreSinonStub(planningNotifications.onPlanningUnspiked);
        });

        it('`planning:created` calls onPlanningCreated', (done) => {
            $rootScope.$broadcast('planning:created', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningCreated.callCount).toBe(1);
                expect(planningNotifications.onPlanningCreated.args[0][1]).toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`planning:updated` calls onPlanningUpdated', (done) => {
            $rootScope.$broadcast('planning:updated', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningUpdated.callCount).toBe(1);
                expect(planningNotifications.onPlanningUpdated.args[0][1]).toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`planning:spiked` calls onPlanningSpiked', (done) => {
            $rootScope.$broadcast('planning:spiked', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningSpiked.callCount).toBe(1);
                expect(planningNotifications.onPlanningSpiked.args[0][1]).toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`planning:unspiked` calls onPlanningUnspiked', (done) => {
            $rootScope.$broadcast('planning:unspiked', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningUnspiked.callCount).toBe(1);
                expect(planningNotifications.onPlanningUnspiked.args[0][1]).toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`planning:lock` calls onPlanningLocked', (done) => {
            $rootScope.$broadcast('planning:lock', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningLocked.callCount).toBe(1);
                expect(planningNotifications.onPlanningLocked.args[0][1]).toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`planning:unlock` calls onPlanningUnlocked', (done) => {
            $rootScope.$broadcast('planning:unlock', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningUnlocked.callCount).toBe(1);
                expect(planningNotifications.onPlanningUnlocked.args[0][1]).toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`planning:published` calls onPlanningPublished', (done) => {
            $rootScope.$broadcast('planning:published', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningPublished.callCount).toBe(1);
                expect(planningNotifications.onPlanningPublished.args[0][1]).toEqual({item: 'p2'});

                done();
            }, delay);
        });

        it('`planning:duplicated` calls onPlanningCreated', (done) => {
            $rootScope.$broadcast('planning:duplicated', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningCreated.callCount).toBe(1);
                expect(planningNotifications.onPlanningCreated.args[0][1]).toEqual({item: 'p2'});

                done();
            }, delay);
        });
    });

    describe('`planning:created`', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'markEventHasPlannings').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsPlanningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(planningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(main, 'setUnsetLoadingIndicator').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.markEventHasPlannings);
            restoreSinonStub(planningUi.scheduleRefetch);
            restoreSinonStub(eventsPlanningUi.scheduleRefetch);
            restoreSinonStub(main.setUnsetLoadingIndicator);
        });

        it('calls refetch on create', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.PLANNING;
            return store.test(done, planningNotifications.onPlanningCreated({}, {
                item: data.plannings[1]._id,
                event_item: data.plannings[1].event_item
            }))
                .then(() => {
                    expect(eventsApi.markEventHasPlannings.callCount).toBe(1);
                    expect(eventsApi.markEventHasPlannings.args[0]).toEqual([
                        data.plannings[1].event_item,
                        data.plannings[1]._id,
                    ]);

                    expect(main.setUnsetLoadingIndicator.callCount).toBe(2);
                    expect(main.setUnsetLoadingIndicator.args).toEqual([
                        [true],
                        [false]
                    ]);

                    expect(planningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    done();
                });
        });
    });

    describe('onPlanningLocked', () => {
        beforeEach(() => {
            sinon.stub(planningApi, 'getPlanning').returns(Promise.resolve(data.plannings[0]));
        });

        afterEach(() => {
            restoreSinonStub(planningApi.getPlanning);
        });

        it('calls getPlanning and dispatches the LOCK_PLANNING action', (done) => (
            store.test(done, planningNotifications.onPlanningLocked(
                {},
                {
                    item: 'p1',
                    lock_action: 'edit',
                    lock_session: 'sess123',
                    lock_time: '2099-10-15T14:30+0000',
                    user: 'user456',
                    etag: 'e789',
                }
            ))
                .then(() => {
                    expect(planningApi.getPlanning.callCount).toBe(1);
                    expect(planningApi.getPlanning.args[0]).toEqual([
                        'p1',
                        false,
                    ]);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'LOCK_PLANNING',
                        payload: {
                            plan: {
                                ...data.plannings[0],
                                lock_action: 'edit',
                                lock_user: 'user456',
                                lock_session: 'sess123',
                                lock_time: '2099-10-15T14:30+0000',
                                _etag: 'e789',
                            },
                        },
                    }]);

                    done();
                })
        ));
    });

    describe('onPlanningUnlocked', () => {
        beforeEach(() => {
            store.initialState.planning.currentPlanningId = 'p1';
            store.initialState.planning.plannings.p1.lock_user = 'ident1';
            store.initialState.planning.plannings.p1.lock_session = 'session1';
        });

        it('dispatches notification modal if item unlocked is being edited', (done) => {
            store.initialState.locks.planning = {
                p1: {
                    action: 'edit',
                    user: 'ident1',
                    session: 'session1',
                    item_id: 'p1',
                    item_type: 'planning',
                },
            };
            store.test(done, planningNotifications.onPlanningUnlocked({},
                {
                    item: 'p1',
                    user: 'ident2',
                }))
                .then(() => {
                    const modalStr = 'The planning item you were editing was unlocked' +
                    ' by "firstname2 lastname2"';

                    expect(store.dispatch.args[0]).toEqual([{type: 'HIDE_MODAL'}]);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'SHOW_MODAL',
                        modalType: 'NOTIFICATION_MODAL',
                        modalProps: {
                            title: 'Item Unlocked',
                            body: modalStr,
                        },
                    }]);

                    done();
                });
        });

        it('dispatches `UNLOCK_PLANNING` action', (done) => (
            store.test(done, planningNotifications.onPlanningUnlocked({},
                {
                    item: 'p1',
                    user: 'ident2',
                    etag: 'e123',
                }))
                .then(() => {
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'UNLOCK_PLANNING',
                        payload: {
                            plan: {
                                ...data.plannings[0],
                                lock_action: null,
                                lock_user: null,
                                lock_session: null,
                                lock_time: null,
                                _etag: 'e123',
                            },
                        },
                    }]);

                    done();
                })
        ));
    });

    describe('onPlanningPublished', () => {
        beforeEach(() => {
            sinon.stub(eventsPlanningUi, 'refetch').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(planningUi.refetch);
            restoreSinonStub(eventsPlanningUi.refetch);
        });

        it('onPlanningPublished calls fetchToList', (done) => {
            sinon.stub(planningUi, 'refetch').callsFake(() => (Promise.resolve()));

            store.test(done, planningNotifications.onPlanningPublished({}, {item: 'p1'}))
                .then(() => {
                // Reloads selected Agenda Plannings
                    expect(planningUi.refetch.callCount).toBe(1);
                    expect(eventsPlanningUi.refetch.callCount).toBe(1);
                    done();
                });
        });
    });

    describe('onPlanningSpiked/onPlanningUnspiked', () => {
        beforeEach(() => {
            restoreSinonStub(planningNotifications.onPlanningSpiked);
            sinon.stub(main, 'closePreviewAndEditorForItems').callsFake(() => (Promise.resolve()));
            sinon.stub(main, 'setUnsetLoadingIndicator').callsFake(() => (Promise.resolve()));
            sinon.stub(planningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsPlanningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(main.closePreviewAndEditorForItems);
            restoreSinonStub(main.setUnsetLoadingIndicator);
            restoreSinonStub(planningUi.scheduleRefetch);
            restoreSinonStub(eventsPlanningUi.scheduleRefetch);
        });

        it('onPlanningSpiked dispatches `SPIKE_PLANNING`', (done) => (
            store.test(done, planningNotifications.onPlanningSpiked({}, {
                item: data.plannings[0]._id,
                state: 'spiked',
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(6);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: PLANNING.ACTIONS.SPIKE_PLANNING,
                        payload: {
                            id: data.plannings[0]._id,
                            state: 'spiked',
                            revert_state: 'draft',
                            etag: 'e123',
                        },
                    }]);

                    expect(main.closePreviewAndEditorForItems.callCount).toBe(1);
                    expect(main.closePreviewAndEditorForItems.args[0]).toEqual([
                        [{_id: data.plannings[0]._id}],
                        'The Planning item was spiked',
                    ]);

                    expect(main.setUnsetLoadingIndicator.callCount).toBe(2);
                    expect(main.setUnsetLoadingIndicator.args).toEqual([
                        [true],
                        [false]
                    ]);

                    expect(planningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);

                    done();
                })
        ));

        it('onPlanningUnspiked dispatches `UNSPIKE_PLANNING`', (done) => (
            store.test(done, planningNotifications.onPlanningUnspiked({}, {
                item: data.plannings[0]._id,
                state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(6);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: PLANNING.ACTIONS.UNSPIKE_PLANNING,
                        payload: {
                            id: data.plannings[0]._id,
                            state: 'draft',
                            etag: 'e123',
                        },
                    }]);

                    expect(main.closePreviewAndEditorForItems.callCount).toBe(1);
                    expect(main.closePreviewAndEditorForItems.args[0]).toEqual([
                        [{_id: data.plannings[0]._id}],
                        'The Planning item was unspiked',
                    ]);

                    expect(main.setUnsetLoadingIndicator.callCount).toBe(2);
                    expect(main.setUnsetLoadingIndicator.args).toEqual([
                        [true],
                        [false]
                    ]);

                    expect(planningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);

                    done();
                })
        ));
    });
});
