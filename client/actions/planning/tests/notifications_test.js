import planningApi from '../api';
import planningUi from '../ui';
import featuredPlanning from '../featuredPlanning';
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
            sinon.stub(planningNotifications, 'onPlanningPosted').callsFake(
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
            restoreSinonStub(planningNotifications.onPlanningPosted);
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

        it('`planning:posted` calls onPlanningPosted', (done) => {
            $rootScope.$broadcast('planning:posted', {item: 'p2'});

            setTimeout(() => {
                expect(planningNotifications.onPlanningPosted.callCount).toBe(1);
                expect(planningNotifications.onPlanningPosted.args[0][1]).toEqual({item: 'p2'});

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
                event_item: data.plannings[1].event_item,
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
                        [false],
                    ]);

                    expect(planningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
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
        ).catch(done.fail));
    });

    describe('onPlanningUnlocked', () => {
        beforeEach(() => {
            store.initialState.planning.currentPlanningId = 'p1';
            store.initialState.planning.plannings.p1.lock_user = 'ident1';
            store.initialState.planning.plannings.p1.lock_session = 'session1';
            sinon.stub(main, 'changeEditorAction').callsFake(() => Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(main.changeEditorAction);
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
            store.initialState.forms.autosaves.planning = {
                p1: {
                    lock_action: 'edit',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                    _id: 'p1',
                    type: 'event',
                },
            };
            store.initialState.forms.editors.panel.itemId = 'p1';
            store.test(done, planningNotifications.onPlanningUnlocked({},
                {
                    item: 'p1',
                    user: 'ident2',
                }))
                .then(() => {
                    const modalStr = 'The planning you were editing was unlocked' +
                    ' by "firstname2 lastname2"';

                    expect(store.dispatch.args[2][0].type).toEqual('AUTOSAVE_REMOVE');
                    expect(store.dispatch.args[3]).toEqual([{
                        type: 'SHOW_MODAL',
                        modalType: 'NOTIFICATION_MODAL',
                        modalProps: {
                            title: 'Item Unlocked',
                            body: modalStr,
                        },
                    }]);
                    expect(store.dispatch.args[4][0].type).toEqual(PLANNING.ACTIONS.UNLOCK_PLANNING);
                    expect(main.changeEditorAction.args[0]).toEqual(['read', false]);
                    done();
                })
                .catch(done.fail);
        });

        it('dispatches `UNLOCK_PLANNING` action', (done) => (
            store.test(done, planningNotifications.onPlanningUnlocked({},
                {
                    item: 'p1',
                    user: 'ident2',
                    etag: 'e123',
                }))
                .then(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'UNLOCK_PLANNING',
                        payload: {
                            plan: {
                                ...data.plannings[0],
                                lock_action: null,
                                lock_user: null,
                                lock_session: null,
                                lock_time: null,
                                _etag: 'e123',
                                event_item: null,
                                recurrence_id: null,
                            },
                        },
                    }]);

                    done();
                })
        ).catch(done.fail));
    });

    describe('onPlanningPosted', () => {
        beforeEach(() => {
            sinon.stub(eventsPlanningUi, 'refetch').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(planningUi.refetch);
            restoreSinonStub(eventsPlanningUi.refetch);
        });

        it('onPlanningPosted calls fetchToList', (done) => {
            sinon.stub(planningUi, 'refetch').callsFake(() => (Promise.resolve()));

            store.test(done, planningNotifications.onPlanningPosted({}, {item: 'p1'}))
                .then(() => {
                // Reloads selected Agenda Plannings
                    expect(planningUi.refetch.callCount).toBe(1);
                    expect(eventsPlanningUi.refetch.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('onPlanningSpiked/onPlanningUnspiked', () => {
        beforeEach(() => {
            restoreSinonStub(planningNotifications.onPlanningSpiked);
            sinon.stub(main, 'closePreviewAndEditorForItems').callsFake(() => (Promise.resolve()));
            sinon.stub(main, 'setUnsetLoadingIndicator').callsFake(() => (Promise.resolve()));
            sinon.stub(planningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsPlanningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsPlanningUi, 'refetchPlanning').callsFake(() => (Promise.resolve()));
            sinon.stub(featuredPlanning, 'removePlanningItemFromSelection').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(featuredPlanning, 'addPlanningItemToSelection').callsFake(
                () => (Promise.resolve())
            );
        });

        afterEach(() => {
            restoreSinonStub(main.closePreviewAndEditorForItems);
            restoreSinonStub(main.setUnsetLoadingIndicator);
            restoreSinonStub(planningUi.scheduleRefetch);
            restoreSinonStub(eventsPlanningUi.scheduleRefetch);
            restoreSinonStub(eventsPlanningUi.refetchPlanning);
            restoreSinonStub(featuredPlanning.removePlanningItemFromSelection);
            restoreSinonStub(featuredPlanning.addPlanningItemToSelection);
        });

        it('onPlanningSpiked dispatches `SPIKE_PLANNING`', (done) => (
            store.test(done, planningNotifications.onPlanningSpiked({}, {
                item: data.plannings[0]._id,
                state: 'spiked',
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(8);
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
                        [false],
                    ]);

                    expect(planningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    expect(featuredPlanning.removePlanningItemFromSelection.callCount).toBe(1);
                    expect(eventsPlanningUi.refetchPlanning.callCount).toBe(1);
                    done();
                })
        ).catch(done.fail));

        it('onPlanningUnspiked dispatches `UNSPIKE_PLANNING`', (done) => (
            store.test(done, planningNotifications.onPlanningUnspiked({}, {
                item: data.plannings[0]._id,
                state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(8);
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
                        [false],
                    ]);

                    expect(planningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    expect(featuredPlanning.addPlanningItemToSelection.callCount).toBe(1);
                    expect(eventsPlanningUi.refetchPlanning.callCount).toBe(1);

                    done();
                })
        ).catch(done.fail));
    });

    describe('onPlanningUpdated', () => {
        beforeEach(() => {
            restoreSinonStub(planningNotifications.onPlanningUpdated);
            restoreSinonStub(planningNotifications.onPlanningSpiked);
            sinon.stub(main, 'closePreviewAndEditorForItems').callsFake(() => (Promise.resolve()));
            sinon.stub(main, 'setUnsetLoadingIndicator').callsFake(() => (Promise.resolve()));
            sinon.stub(planningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsPlanningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsPlanningUi, 'refetchPlanning').callsFake(() => (Promise.resolve()));
            sinon.stub(featuredPlanning, 'removePlanningItemFromSelection').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(featuredPlanning, 'addPlanningItemToSelection').callsFake(
                () => (Promise.resolve())
            );
        });

        afterEach(() => {
            restoreSinonStub(main.closePreviewAndEditorForItems);
            restoreSinonStub(main.setUnsetLoadingIndicator);
            restoreSinonStub(planningUi.scheduleRefetch);
            restoreSinonStub(eventsPlanningUi.scheduleRefetch);
            restoreSinonStub(eventsPlanningUi.refetchPlanning);
            restoreSinonStub(featuredPlanning.removePlanningItemFromSelection);
            restoreSinonStub(featuredPlanning.addPlanningItemToSelection);
        });

        it('onPlanningUpdated does call scheduleRefetch if item is being edited', (done) => {
            store.initialState.planning.plannings['p1'] = {
                lock_action: 'edit',
                lock_user: 'ident1',
                lock_session: 'session1',
                _id: 'p1',
                type: 'planning',
            };
            store.initialState.forms.editors.panel.itemId = 'p1';
            store.initialState.locks.planning.p1 = {
                action: 'edit',
                user: 'ident1',
                session: 'session1',
                item_id: 'p1',
                item_type: 'planning',
            };

            return store.test(done, planningNotifications.onPlanningUpdated({}, {item: data.plannings[0]._id}))
                .then(() => {
                    expect(planningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });

        it('onPlanningUpdated does calls scheduleRefetch if item is not being edited', (done) => (
            store.test(done, planningNotifications.onPlanningUpdated({}, {item: data.plannings[0]._id}))
                .then(() => {
                    expect(planningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    done();
                })
                .catch(done.fail)
        ));
    });
});
