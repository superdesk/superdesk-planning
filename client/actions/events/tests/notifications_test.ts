import eventsApi from '../api';
import eventsUi from '../ui';
import eventsPlanningUi from '../../eventsPlanning/ui';
import planningApi from '../../planning/api';
import main from '../../main';
import sinon from 'sinon';
import {registerNotifications} from '../../../utils';
import eventsNotifications from '../notifications';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import moment from 'moment';
import {EVENTS} from '../../../constants';

describe('actions.events.notifications', () => {
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
            sinon.stub(eventsNotifications, 'onEventLocked').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(eventsNotifications, 'onEventUnlocked').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(eventsNotifications, 'onEventSpiked').callsFake(
                () => (Promise.resolve())
            );
            sinon.stub(eventsNotifications, 'onEventUnspiked').callsFake(
                () => (Promise.resolve())
            );

            sinon.stub(eventsNotifications, 'onEventScheduleChanged').callsFake(
                () => (Promise.resolve())
            );

            sinon.stub(eventsNotifications, 'onEventPostChanged').callsFake(
                () => (Promise.resolve())
            );

            sinon.stub(eventsNotifications, 'onRecurringEventCreated').callsFake(
                () => (Promise.resolve())
            );

            sinon.stub(eventsNotifications, 'onEventUpdated').callsFake(
                () => (Promise.resolve())
            );

            sinon.stub(eventsNotifications, 'onEventCreated').callsFake(
                () => (Promise.resolve())
            );

            $rootScope = _$rootScope_;
            registerNotifications($rootScope, store);
            $rootScope.$digest();
        }));

        afterEach(() => {
            restoreSinonStub(eventsNotifications.onEventLocked);
            restoreSinonStub(eventsNotifications.onEventUnlocked);
            restoreSinonStub(eventsNotifications.onEventSpiked);
            restoreSinonStub(eventsNotifications.onEventUnspiked);
            restoreSinonStub(eventsNotifications.onEventScheduleChanged);
            restoreSinonStub(eventsNotifications.onEventPostChanged);
            restoreSinonStub(eventsNotifications.onRecurringEventCreated);
            restoreSinonStub(eventsNotifications.onEventUpdated);
            restoreSinonStub(eventsNotifications.onEventCreated);
        });

        it('`events:lock` calls onEventLocked', (done) => {
            $rootScope.$broadcast('events:lock', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventLocked.callCount).toBe(1);
                expect(eventsNotifications.onEventLocked.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:unlock` calls onEventUnlocked', (done) => {
            $rootScope.$broadcast('events:unlock', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventUnlocked.callCount).toBe(1);
                expect(eventsNotifications.onEventUnlocked.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:spiked` calls onEventSpiked', (done) => {
            $rootScope.$broadcast('events:spiked', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventSpiked.callCount).toBe(1);
                expect(eventsNotifications.onEventSpiked.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:unspiked` calls onEventUnspiked', (done) => {
            $rootScope.$broadcast('events:unspiked', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventUnspiked.callCount).toBe(1);
                expect(eventsNotifications.onEventUnspiked.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:reschedule` calls onEventScheduleChanged', (done) => {
            $rootScope.$broadcast('events:reschedule', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventScheduleChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventScheduleChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:reschedule:recurring` calls onEventScheduleChanged', (done) => {
            $rootScope.$broadcast('events:reschedule:recurring', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventScheduleChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventScheduleChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:update_time` calls onEventScheduleChanged', (done) => {
            $rootScope.$broadcast('events:update_time', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventScheduleChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventScheduleChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:update_time:recurring` calls onEventScheduleChanged', (done) => {
            $rootScope.$broadcast('events:update_time:recurring', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventScheduleChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventScheduleChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:posted` calls onEventPostChanged', (done) => {
            $rootScope.$broadcast('events:posted', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventPostChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventPostChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:posted:recurring` calls onEventPostChanged', (done) => {
            $rootScope.$broadcast('events:posted:recurring', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventPostChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventPostChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:unposted` calls onEventPostChanged', (done) => {
            $rootScope.$broadcast('events:unposted', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventPostChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventPostChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:unposted:recurring` calls onEventPostChanged', (done) => {
            $rootScope.$broadcast('events:unposted:recurring', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventPostChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventPostChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:created` calls onEventCreated', (done) => {
            $rootScope.$broadcast('events:created', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventCreated.callCount).toBe(1);
                expect(eventsNotifications.onEventCreated.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:created:recurring` calls onRecurringEventCreated', (done) => {
            $rootScope.$broadcast('events:created:recurring', {item: 'rec1'});

            setTimeout(() => {
                expect(eventsNotifications.onRecurringEventCreated.callCount).toBe(1);
                expect(eventsNotifications.onRecurringEventCreated.args[0][1]).toEqual({item: 'rec1'});

                done();
            }, delay);
        });

        it('`events:updated` calls onEventUpdated', (done) => {
            $rootScope.$broadcast('events:updated', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventUpdated.callCount).toBe(1);
                expect(eventsNotifications.onEventUpdated.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:updated:recurring` calls onEventUpdated', (done) => {
            $rootScope.$broadcast('events:updated:recurring', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventUpdated.callCount).toBe(1);
                expect(eventsNotifications.onEventUpdated.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });

        it('`events:update_repetitions:recurring` calls onEventScheduleChanged', (done) => {
            $rootScope.$broadcast('events:update_repetitions:recurring', {item: 'e1'});

            setTimeout(() => {
                expect(eventsNotifications.onEventScheduleChanged.callCount).toBe(1);
                expect(eventsNotifications.onEventScheduleChanged.args[0][1]).toEqual({item: 'e1'});

                done();
            }, delay);
        });
    });

    describe('onEventPostChanged', () => {
        beforeEach(() => {
            restoreSinonStub(eventsNotifications.onEventPostChanged);
            sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
                () => (Promise.resolve())
            );
        });

        afterEach(() => {
            restoreSinonStub(planningApi.loadPlanningByEventId);
        });

        xit('dispatches `MARK_EVENT_POSTED`', (done) => (
            store.test(done, eventsNotifications.onEventPostChanged(
                {},
                {
                    item: data.events[0]._id,
                    state: 'scheduled',
                    pubstatus: 'usable',
                    etag: data.events[0]._etag,
                }
            ))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(2);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MARK_EVENT_POSTED',
                        payload: {
                            item: data.events[0]._id,
                            items: [{
                                id: data.events[0]._id,
                                etag: data.events[0]._etag,
                            }],
                            state: 'scheduled',
                            pubstatus: 'usable',
                        },
                    }]);
                    done();
                })
        ).catch(done.fail));

        xit('dispatches `MARK_EVENT_POSTED` for multiple events', (done) => (
            store.test(done, eventsNotifications.onEventPostChanged(
                {},
                {
                    item: data.events[0]._id,
                    items: [{
                        id: data.events[0]._id,
                        etag: data.events[0]._etag,
                    }, {
                        id: data.events[1]._id,
                        etag: data.events[1]._etag,
                    }, {
                        id: data.events[2]._id,
                        etag: data.events[2]._etag,
                    }],
                    state: 'scheduled',
                    pubstatus: 'usable',
                    etag: data.events[0]._etag,
                }
            ))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(2);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MARK_EVENT_POSTED',
                        payload: {
                            item: data.events[0]._id,
                            items: [{
                                id: data.events[0]._id,
                                etag: data.events[0]._etag,
                            }, {
                                id: data.events[1]._id,
                                etag: data.events[1]._etag,
                            }, {
                                id: data.events[2]._id,
                                etag: data.events[2]._etag,
                            }],
                            state: 'scheduled',
                            pubstatus: 'usable',
                        },
                    }]);
                    done();
                })
        ).catch(done.fail));

        xit('dispatches `MARK_EVENT_UNPOSTED`', (done) => (
            store.test(done, eventsNotifications.onEventPostChanged(
                {},
                {
                    item: data.events[0]._id,
                    state: 'killed',
                    pubstatus: 'cancelled',
                    etag: 'e123',
                }
            ))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(3);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MARK_EVENT_UNPOSTED',
                        payload: {
                            item: data.events[0]._id,
                            items: [{
                                id: data.events[0]._id,
                                etag: data.events[0]._etag,
                            }],
                            state: 'killed',
                            pubstatus: 'cancelled',
                        },
                    }]);
                    done();
                })
        ).catch(done.fail));

        xit('dispatches `MARK_EVENT_UNPOSTED` for multiple events', (done) => (
            store.test(done, eventsNotifications.onEventPostChanged(
                {},
                {
                    item: data.events[0]._id,
                    items: [{
                        id: data.events[0]._id,
                        etag: data.events[0]._etag,
                    }, {
                        id: data.events[1]._id,
                        etag: data.events[1]._etag,
                    }, {
                        id: data.events[2]._id,
                        etag: data.events[2]._etag,
                    }],
                    state: 'killed',
                    pubstatus: 'cancelled',
                    etag: 'e123',
                }
            ))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(3);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MARK_EVENT_UNPOSTED',
                        payload: {
                            item: data.events[0]._id,
                            items: [{
                                id: data.events[0]._id,
                                etag: data.events[0]._etag,
                            }, {
                                id: data.events[1]._id,
                                etag: data.events[1]._etag,
                            }, {
                                id: data.events[2]._id,
                                etag: data.events[2]._etag,
                            }],
                            state: 'killed',
                            pubstatus: 'cancelled',
                        },
                    }]);
                    done();
                })
        ).catch(done.fail));

        xit('fetches associated plannings for an event', (done) => (
            store.test(done, eventsNotifications.onEventPostChanged(
                {},
                {
                    item: data.events[0]._id,
                    state: 'killed',
                    pubstatus: 'cancelled',
                    etag: 'e123',
                }
            ))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(3);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'MARK_EVENT_UNPOSTED',
                        payload: {
                            item: data.events[0]._id,
                            items: [{
                                id: data.events[0]._id,
                                etag: data.events[0]._etag,
                            }],
                            state: 'killed',
                            pubstatus: 'cancelled',
                        },
                    }]);
                    expect(planningApi.loadPlanningByEventId.callCount).toBe(1);
                    done();
                })
        ).catch(done.fail));

        it('fetches associated plannings for an event', (done) => (
            store.test(done, eventsNotifications.onEventPostChanged(
                {},
                {
                    item: data.events[0]._id,
                    state: 'killed',
                    pubstatus: 'cancelled',
                    etag: 'e123',
                }
            ))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(6);
                    expect(planningApi.loadPlanningByEventId.callCount).toBe(1);
                    done();
                })
        ).catch(done.fail));
    });

    describe('onEventLocked', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'getEvent').returns(Promise.resolve(data.events[0]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.getEvent);
        });

        it('calls getEvent and dispatches the LOCK_EVENT action', (done) => (
            store.test(done, eventsNotifications.onEventLocked(
                {},
                {
                    item: 'e1',
                    lock_action: 'edit',
                    lock_session: 'sess123',
                    lock_time: '2099-10-15T14:30+0000',
                    user: 'user456',
                    etag: 'e789',
                }
            ))
                .then(() => {
                    expect(eventsApi.getEvent.callCount).toBe(1);
                    expect(eventsApi.getEvent.args[0]).toEqual([
                        'e1',
                        false,
                    ]);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'LOCK_EVENT',
                        payload: {
                            event: {
                                ...data.events[0],
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

    describe('onEventUnlocked', () => {
        beforeEach(() => {
            store.initialState.events.events.e1.lock_user = 'ident1';
            store.initialState.events.events.e1.lock_session = 'session1';
            sinon.stub(main, 'changeEditorAction').callsFake(() => Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(main.changeEditorAction);
        });

        it('dispatches notification modal if the Event unlocked is being edited', (done) => {
            store.initialState.locks.event = {
                e1: {
                    action: 'edit',
                    user: 'ident1',
                    session: 'session1',
                    item_id: 'e1',
                    item_type: 'event',
                },
            };
            store.initialState.forms.autosaves.event = {
                e1: {
                    lock_action: 'edit',
                    lock_user: 'ident1',
                    lock_session: 'session1',
                    _id: 'e1',
                    type: 'event',
                },
            };
            store.initialState.forms.editors.panel.itemId = 'e1';
            store.test(done, eventsNotifications.onEventUnlocked(
                {},
                {
                    item: 'e1',
                    user: 'ident2',
                    session: 'session2',
                }
            ))
                .then(() => {
                    const modalStr = 'The event you were editing was unlocked' +
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
                    expect(store.dispatch.args[4][0].type).toEqual(EVENTS.ACTIONS.UNLOCK_EVENT);
                    expect(main.changeEditorAction.args[0]).toEqual(['read', false]);
                    done();
                })
                .catch(done.fail);
        });

        it('dispatches `UNLOCK_EVENT` action', (done) => (
            store.test(done, eventsNotifications.onEventUnlocked(
                {},
                {
                    item: 'e1',
                    user: 'ident2',
                    etag: 'e123',
                }
            ))
                .then(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'UNLOCK_EVENT',
                        payload: {
                            event: {
                                ...data.events[0],
                                dates: {
                                    ...data.events[0].dates,
                                    start: moment(data.events[0].dates.start),
                                    end: moment(data.events[0].dates.end),
                                },
                                lock_action: null,
                                lock_user: null,
                                lock_session: null,
                                lock_time: null,
                                _etag: 'e123',
                                recurrence_id: null,
                            },
                        },
                    }]);

                    done();
                })
        ).catch(done.fail));
    });

    describe('onEventSpiked/onEventUnspiked', () => {
        beforeEach(() => {
            restoreSinonStub(eventsNotifications.onEventSpiked);
            sinon.stub(main, 'closePreviewAndEditorForItems').callsFake(() => (Promise.resolve()));
            sinon.stub(main, 'setUnsetLoadingIndicator').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsPlanningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(main.closePreviewAndEditorForItems);
            restoreSinonStub(main.setUnsetLoadingIndicator);
            restoreSinonStub(eventsUi.scheduleRefetch);
            restoreSinonStub(eventsPlanningUi.scheduleRefetch);
        });

        it('onEventSpiked dispatches `SPIKE_EVENT`', (done) => (
            store.test(done, eventsNotifications.onEventSpiked({}, {
                item: data.events[0]._id,
                spiked_items: [{
                    id: data.events[0]._id,
                    etag: 'e123',
                    revert_state: 'draft',
                }],
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(6);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: EVENTS.ACTIONS.SPIKE_EVENT,
                        payload: {
                            item: data.events[0]._id,
                            items: [{
                                id: data.events[0]._id,
                                etag: 'e123',
                                revert_state: 'draft',
                            }],
                        },
                    }]);

                    expect(main.closePreviewAndEditorForItems.callCount).toBe(1);
                    expect(main.closePreviewAndEditorForItems.args[0]).toEqual([
                        [{
                            id: data.events[0]._id,
                            etag: 'e123',
                            revert_state: 'draft',
                        }],
                        'The Event was spiked',
                        'id',
                    ]);

                    expect(main.setUnsetLoadingIndicator.callCount).toBe(2);
                    expect(main.setUnsetLoadingIndicator.args).toEqual([
                        [true],
                        [false],
                    ]);

                    expect(eventsUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);

                    done();
                })
        ).catch(done.fail));

        it('onEventUnspiked dispatches `UNSPIKE_EVENT`', (done) => (
            store.test(done, eventsNotifications.onEventUnspiked({}, {
                item: data.events[0]._id,
                unspiked_items: [{
                    id: data.events[0]._id,
                    etag: 'e123',
                    revert_state: 'draft',
                }],
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(6);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: EVENTS.ACTIONS.UNSPIKE_EVENT,
                        payload: {
                            item: data.events[0]._id,
                            items: [{
                                id: data.events[0]._id,
                                etag: 'e123',
                                revert_state: 'draft',
                            }],
                        },
                    }]);

                    expect(main.closePreviewAndEditorForItems.callCount).toBe(1);
                    expect(main.closePreviewAndEditorForItems.args[0]).toEqual([
                        [{
                            id: data.events[0]._id,
                            etag: 'e123',
                            revert_state: 'draft',
                        }],
                        'The Event was unspiked',
                        'id',
                    ]);

                    expect(main.setUnsetLoadingIndicator.callCount).toBe(2);
                    expect(main.setUnsetLoadingIndicator.args).toEqual([
                        [true],
                        [false],
                    ]);

                    expect(eventsUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);

                    done();
                })
        ).catch(done.fail));
    });

    describe('onEventUpdated', () => {
        beforeEach(() => {
            restoreSinonStub(eventsNotifications.onEventUpdated);
            sinon.stub(main, 'closePreviewAndEditorForItems').callsFake(() => (Promise.resolve()));
            sinon.stub(main, 'setUnsetLoadingIndicator').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
            sinon.stub(eventsPlanningUi, 'scheduleRefetch').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(main.closePreviewAndEditorForItems);
            restoreSinonStub(main.setUnsetLoadingIndicator);
            restoreSinonStub(eventsUi.scheduleRefetch);
            restoreSinonStub(eventsPlanningUi.scheduleRefetch);
        });

        it('onEventUpdated does call scheduleRefetch if item is being edited', (done) => {
            store.initialState.events.events['e1'] = {
                lock_action: 'edit',
                lock_user: 'ident1',
                lock_session: 'session1',
                _id: 'e1',
                type: 'event',
            };
            store.initialState.forms.editors.panel.itemId = 'e1';
            store.initialState.locks.event.e1 = {
                action: 'edit',
                user: 'ident1',
                session: 'session1',
                item_id: 'e1',
                item_type: 'event',
            };

            return store.test(done, eventsNotifications.onEventUpdated({}, {item: data.events[0]._id}))
                .then(() => {
                    expect(eventsUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });

        it('onEventUpdated does calls scheduleRefetch if item is not being edited', (done) => (
            store.test(done, eventsNotifications.onEventUpdated({}, {item: data.events[0]._id}))
                .then(() => {
                    expect(eventsUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    done();
                })
                .catch(done.fail)
        ));

        it('onEventUpdated calls scheduleRefetch if item edited is a recurring event', (done) => {
            store.initialState.events.events['e1'] = {
                lock_action: 'edit',
                lock_user: 'ident1',
                lock_session: 'session1',
                _id: 'e1',
                type: 'event',
                recurrence_id: 'rec1',
            };
            store.initialState.forms.editors.panel.itemId = 'e1';

            return store.test(done, eventsNotifications.onEventUpdated({}, {
                item: data.events[0]._id,
                recurrence_id: 'rec1',
            }))
                .then(() => {
                    expect(eventsUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);
                    expect(eventsUi.scheduleRefetch.args[0]).toEqual([[data.events[0]._id]]);
                    done();
                })
                .catch(done.fail);
        });
    });

    it('calls scheduleRefetch for events.ui and eventsPlanning.ui', (done) => {
        sinon.stub(eventsUi, 'scheduleRefetch').returns(Promise.resolve());
        sinon.stub(eventsPlanningUi, 'scheduleRefetch').returns(Promise.resolve());

        store.test(done, eventsNotifications.onEventCreated({}, {item: 'e1'}))
            .then(() => {
                expect(eventsUi.scheduleRefetch.callCount).toBe(1);
                expect(eventsPlanningUi.scheduleRefetch.callCount).toBe(1);

                restoreSinonStub(eventsUi.scheduleRefetch);
                restoreSinonStub(eventsPlanningUi.scheduleRefetch);

                done();
            })
            .catch(done.fail);
    });
});
