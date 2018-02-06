import notifications from '../notifications';
import {getTestActionStore} from '../../../utils/testUtils';
import {EVENTS_PLANNING, MAIN} from '../../../constants';

describe('actions.eventsplanning.notifications', () => {
    let store;
    let data;

    beforeEach(() => {
        store = getTestActionStore();
        data = store.data;
    });

    describe('spike event', () => {
        it('dispatch `SPIKE_EVENT` if in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;

            store.test(done, notifications.onEventSpiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_EVENT,
                        payload: {
                            id: data.events[0]._id,
                            spikeState: 'draft'
                        },
                    }]);

                    done();
                });
        });

        it('no dispatch `SPIKE_EVENT` if not in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.EVENTS;

            store.test(done, notifications.onEventSpiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(0);
                    done();
                });
        });
    });

    describe('unspike event', () => {
        it('dispatch `UNSPIKE_EVENT` if in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;

            store.test(done, notifications.onEventUnspiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: EVENTS_PLANNING.ACTIONS.UNSPIKE_EVENT,
                        payload: {
                            id: data.events[0]._id,
                            spikeState: 'draft'
                        },
                    }]);

                    done();
                });
        });

        it('no dispatch `UNSPIKE_EVENT` if not in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.EVENTS;

            store.test(done, notifications.onEventSpiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(0);
                    done();
                });
        });
    });

    describe('spike planning', () => {
        it('dispatch `SPIKE_PLANNING` if in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;

            store.test(done, notifications.onPlanningSpiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_PLANNING,
                        payload: {
                            id: data.events[0]._id,
                            spikeState: 'draft'
                        },
                    }]);

                    done();
                });
        });

        it('no dispatch `SPIKE_PLANNING` if not in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.EVENTS;

            store.test(done, notifications.onPlanningUnspiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(0);
                    done();
                });
        });
    });

    describe('unspike planning', () => {
        it('dispatch `UNSPIKE_PLANNING` if in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;

            store.test(done, notifications.onPlanningUnspiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: EVENTS_PLANNING.ACTIONS.UNSPIKE_PLANNING,
                        payload: {
                            id: data.events[0]._id,
                            spikeState: 'draft'
                        },
                    }]);

                    done();
                });
        });

        it('no dispatch `UNSPIKE_PLANNING` if not in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.EVENTS;

            store.test(done, notifications.onPlanningUnspiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(0);
                    done();
                });
        });
    });

    describe('spike recurring event', () => {
        it('dispatch `SPIKE_EVENT` recurring if in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;

            store.test(done, notifications.onRecurringEventSpiked({}, {
                items: data.events,
                recurrence_id: 'rid',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: EVENTS_PLANNING.ACTIONS.SPIKE_RECURRING_EVENTS,
                        payload: {
                            ids: ['e1', 'e2', 'e3'],
                            spikeState: 'draft',
                            recurrence_id: 'rid'
                        },
                    }]);

                    done();
                });
        });

        it('no dispatch `SPIKE_EVENT` recurring if not in the combined view', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.EVENTS;

            store.test(done, notifications.onRecurringEventSpiked({}, {
                item: data.events[0]._id,
                revert_state: 'draft',
                etag: 'e123',
            }))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(0);
                    done();
                });
        });
    });
});