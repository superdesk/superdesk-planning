import eventsApi from '../api';
import eventsUi from '../ui';
import planningApi from '../../planning/api';
import {PRIVILEGES} from '../../../constants';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub, expectAccessDenied} from '../../../utils/testUtils';
import moment from 'moment';

describe('actions.events.ui', () => {
    let errorMessage;
    let store;
    let services;
    let data;

    beforeEach(() => {
        errorMessage = {data: {_message: 'Failed!'}};
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        sinon.stub(eventsApi, 'loadEventsByRecurrenceId').callsFake(
            () => (Promise.resolve(data.events))
        );

        sinon.stub(eventsApi, 'loadRecurringEventsAndPlanningItems').callsFake(
            () => (Promise.resolve(data.events[0]))
        );

        sinon.stub(eventsApi, 'spike').callsFake(
            () => (Promise.resolve(data.events))
        );

        sinon.stub(eventsApi, 'unspike').callsFake(
            () => (Promise.resolve(data.events))
        );

        sinon.stub(eventsApi, 'refetchEvents').callsFake(() => (Promise.resolve()));

        sinon.stub(eventsUi, '_openActionModal').callsFake(
            () => (Promise.resolve())
        );

        sinon.stub(eventsUi, 'refetchEvents').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsUi, 'closeEventDetails').callsFake(() => (Promise.resolve()));

        sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
            () => (Promise.resolve(data.plannings))
        );

        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve([])));

        sinon.stub(eventsUi, 'setEventsList').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsApi, 'loadEventDataForAction').callsFake(
            (event) => (Promise.resolve(event))
        );

        sinon.stub(eventsUi, '_openEventDetails').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsApi, 'lock').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(eventsApi, 'unlock').callsFake((item) => (Promise.resolve(item)));

        sinon.stub(eventsApi, 'rescheduleEvent').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsApi, 'publishEvent').callsFake((e) => (Promise.resolve(e)));
    });

    afterEach(() => {
        restoreSinonStub(eventsApi.fetch);
        restoreSinonStub(eventsApi.spike);
        restoreSinonStub(eventsApi.unspike);
        restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
        restoreSinonStub(eventsApi.loadRecurringEventsAndPlanningItems);
        restoreSinonStub(eventsApi.refetchEvents);
        restoreSinonStub(eventsUi._openActionModal);
        restoreSinonStub(eventsUi.refetchEvents);
        restoreSinonStub(eventsUi.setEventsList);
        restoreSinonStub(eventsUi._openEventDetails);
        restoreSinonStub(eventsUi.closeEventDetails);
        restoreSinonStub(eventsApi.loadEventDataForAction);
        restoreSinonStub(eventsApi.lock);
        restoreSinonStub(eventsApi.unlock);
        restoreSinonStub(eventsApi.rescheduleEvent);
        restoreSinonStub(eventsApi.publishEvent);
        restoreSinonStub(planningApi.loadPlanningByEventId);
        restoreSinonStub(planningApi.fetch);
    });

    it('openSpikeModal calls `_openActionModal`', (done) => (
        store.test(done, eventsUi.openSpikeModal(data.events[1]))
            .then(() => {
                expect(eventsUi._openActionModal.callCount).toBe(1);
                expect(eventsUi._openActionModal.args[0]).toEqual([
                    data.events[1],
                    'Spike',
                    null,
                    true,
                    false,
                ]);

                done();
            })
    ));

    it('openCancelModal calls `_openActionModal`', (done) => (
        store.test(done, eventsUi.openCancelModal(data.events[1]))
            .then(() => {
                expect(eventsUi._openActionModal.callCount).toBe(1);
                expect(eventsUi._openActionModal.args[0]).toEqual([
                    data.events[1],
                    'Cancel',
                    'cancel_event',
                    true,
                    false,
                ]);

                done();
            })
    ));

    it('openPostponeModal calls `_openActionModal`', (done) => (
        store.test(done, eventsUi.openPostponeModal(data.events[1]))
            .then(() => {
                expect(eventsUi._openActionModal.callCount).toBe(1);
                expect(eventsUi._openActionModal.args[0]).toEqual([
                    data.events[1],
                    'Mark as Postponed',
                    'postpone_event',
                    true,
                    false,
                ]);

                done();
            })
    ));

    it('updateTime calls `_openActionModal`', (done) => (
        store.test(done, eventsUi.updateTime(data.events[1]))
            .then(() => {
                expect(eventsUi._openActionModal.callCount).toBe(1);
                expect(eventsUi._openActionModal.args[0]).toEqual([
                    data.events[1],
                    'Update time',
                    'update_time',
                    false,
                    false,
                ]);

                done();
            })
    ));

    it('openRescheduleModal calls `_openActionModal`', (done) => (
        store.test(done, eventsUi.openRescheduleModal(data.events[1]))
            .then(() => {
                expect(eventsUi._openActionModal.callCount).toBe(1);
                expect(eventsUi._openActionModal.args[0]).toEqual([
                    data.events[1],
                    'Reschedule',
                    'reschedule_event',
                    true,
                    false,
                    true,
                ]);

                done();
            })
    ));

    describe('openActionModal', () => {
        beforeEach(() => {
            restoreSinonStub(eventsUi._openActionModal);
        });

        it('openActionModal locks event, calls loadEventDataForAction then shows modal', (done) => (
            store.test(done, eventsUi._openActionModal(
                data.events[1],
                'Cancel Event',
                'cancel_event',
                true,
                false
            )).then(() => {
                expect(eventsApi.lock.callCount).toBe(1);
                expect(eventsApi.lock.args[0]).toEqual([data.events[1], 'cancel_event']);

                expect(eventsApi.loadEventDataForAction.callCount).toBe(1);
                expect(eventsApi.loadEventDataForAction.args[0]).toEqual([
                    data.events[1],
                    true,
                    false,
                ]);

                expect(store.dispatch.callCount).toBe(3);
                expect(store.dispatch.args[2]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'ITEM_ACTIONS_MODAL',
                    modalProps: {
                        eventDetail: data.events[1],
                        actionType: 'Cancel Event',
                        large: false,
                    },
                }]);

                done();
            })
        ));

        it('openActionModal displays error message if lock fails', (done) => {
            restoreSinonStub(eventsApi.lock);
            sinon.stub(eventsApi, 'lock').callsFake(() => (Promise.reject(errorMessage)));
            return store.test(done, eventsUi._openActionModal(
                data.events[1],
                'Cancel Event',
                'cancel_event',
                true,
                false
            )).then(() => { /* no-op */ }, (error) => {
                expect(error).toEqual(errorMessage);
                done();
            });
        });

        it('openActionModal displays error message if loadEvents fails', (done) => {
            restoreSinonStub(eventsApi.loadEventDataForAction);
            sinon.stub(eventsApi, 'loadEventDataForAction').callsFake(
                () => (Promise.reject(errorMessage))
            );
            return store.test(done, eventsUi._openActionModal(
                data.events[1],
                'Cancel Event',
                'cancel_event',
                true,
                false
            )).then(() => { /* no-op */ }, (error) => {
                expect(error).toEqual(errorMessage);
                done();
            });
        });
    });

    describe('openBulkSpikeModal', () => {
        it('shows the spike modal', (done) => (
            store.test(done, eventsUi.openBulkSpikeModal(data.events))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(2);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'SHOW_MODAL',
                        modalType: 'CONFIRMATION',
                        modalProps: jasmine.objectContaining(
                            {body: 'Do you want to spike these 3 events?'}
                        ),
                    }]);

                    done();
                })
        ));

        it('openBulkSpikeModal raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_event_spike = 0;
            return store.test(done, eventsUi.openBulkSpikeModal(data.events))
                .catch(() => {
                    expectAccessDenied({
                        store: store,
                        permission: PRIVILEGES.SPIKE_EVENT,
                        action: '_openBulkSpikeModal',
                        errorMessage: 'Unauthorised to spike an Event',
                        args: [data.events],
                    });

                    done();
                });
        });
    });

    describe('openUnspikeModal', () => {
        it('shows the unspike modal', (done) => (
            store.test(done, eventsUi.openUnspikeModal(data.events))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(2);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'SHOW_MODAL',
                        modalType: 'CONFIRMATION',
                        modalProps: jasmine.objectContaining(
                            {body: 'Do you want to unspike these 3 events?'}
                        ),
                    }]);

                    done();
                })
        ));

        it('openUnspikeModal raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_event_unspike = 0;
            return store.test(done, eventsUi.openUnspikeModal(data.events))
                .catch(() => {
                    expectAccessDenied({
                        store: store,
                        permission: PRIVILEGES.UNSPIKE_EVENT,
                        action: '_openUnspikeModal',
                        errorMessage: 'Unauthorised to unspike an Event',
                        args: [data.events],
                    });

                    done();
                });
        });
    });

    describe('spike', () => {
        it('calls `api.spike`', (done) => (
            store.test(done, eventsUi.spike(data.events[0]))
                .then((items) => {
                    expect(items).toEqual(data.events);

                    expect(eventsApi.spike.callCount).toBe(1);
                    expect(eventsApi.spike.args[0]).toEqual([data.events[0]]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['The event(s) have been spiked']);

                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('notifies user if `api.spike` fails', (done) => {
            restoreSinonStub(eventsApi.spike);
            sinon.stub(eventsApi, 'spike').callsFake(() => (Promise.reject(errorMessage)));

            return store.test(done, eventsUi.spike(data.events[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.success.callCount).toBe(0);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('unspike', () => {
        it('calls `api.unspike`', (done) => (
            store.test(done, eventsUi.unspike(data.events[0]))
                .then((items) => {
                    expect(items).toEqual(data.events);

                    expect(eventsApi.unspike.callCount).toBe(1);
                    expect(eventsApi.unspike.args[0]).toEqual([data.events[0]]);

                    expect(eventsUi.refetchEvents.callCount).toBe(1);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['The event(s) have been unspiked']);

                    expect(services.notify.error.callCount).toBe(0);

                    done();
                })
        ));

        it('notifies user if `api.unspike` fails', (done) => {
            restoreSinonStub(eventsApi.unspike);
            sinon.stub(eventsApi, 'unspike').callsFake(() => (Promise.reject(errorMessage)));

            return store.test(done, eventsUi.unspike(data.events[0]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.success.callCount).toBe(0);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    it('setEventsList', () => {
        restoreSinonStub(eventsUi.setEventsList);
        expect(eventsUi.setEventsList(['e1', 'e2'])).toEqual({
            type: 'SET_EVENTS_LIST',
            payload: ['e1', 'e2'],
        });
    });

    describe('refetchEvents', () => {
        it('updates list', (done) => {
            restoreSinonStub(eventsApi.refetchEvents);
            restoreSinonStub(eventsUi.refetchEvents);

            sinon.stub(eventsApi, 'refetchEvents').callsFake(
                () => (Promise.resolve(data.events))
            );

            return store.test(done, eventsUi.refetchEvents())
                .then((events) => {
                    expect(events).toEqual(data.events);

                    expect(eventsApi.refetchEvents.callCount).toBe(1);

                    expect(eventsUi.setEventsList.callCount).toBe(1);
                    expect(eventsUi.setEventsList.args[0]).toEqual([['e1', 'e2', 'e3']]);

                    done();
                });
        });

        it('notifies user if api.refetchEvents fails', (done) => {
            restoreSinonStub(eventsApi.refetchEvents);
            restoreSinonStub(eventsUi.refetchEvents);

            sinon.stub(eventsApi, 'refetchEvents').callsFake(
                () => (Promise.reject(errorMessage))
            );

            return store.test(done, eventsUi.refetchEvents())
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('openEventDetails', () => {
        it('openEventDetails dispatches action', (done) => {
            store.test(done, eventsUi.openEventDetails())
                .then(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'OPEN_EVENT_DETAILS',
                        payload: true,
                    }]);
                    done();
                });
        });

        it('openEventDetails calls `lockEvent` api', (done) => {
            store.test(done, eventsUi.openEventDetails(data.events[0]))
                .then(() => {
                    expect(eventsApi.lock.callCount).toBe(1);
                    done();
                });
        });

        it('openEventDetails dispatches previewEvent if insufficient privileges', (done) => {
            store.initialState.privileges.planning_event_management = 0;
            store.test(done, eventsUi.openEventDetails(data.events[0]))
                .catch(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'PREVIEW_EVENT',
                        payload: data.events[0]._id,
                    }]);

                    expectAccessDenied({
                        store: store,
                        permission: PRIVILEGES.EVENT_MANAGEMENT,
                        action: '_openEventDetails',
                        errorMessage: 'Unauthorised to edit an event!',
                        args: [data.events[0]],
                        argPos: 2,
                    });

                    done();
                });
        });
    });

    it('closeEventDetails', (done) => {
        restoreSinonStub(eventsUi.closeEventDetails);
        store.test(done, eventsUi.closeEventDetails())
            .then(() => {
                expect(store.dispatch.args[0]).toEqual([{type: 'CLOSE_EVENT_DETAILS'}]);
                done();
            });
    });

    it('_previewEvent', () => {
        expect(eventsUi._previewEvent(data.events[0])).toEqual({
            type: 'PREVIEW_EVENT',
            payload: data.events[0]._id,
        });
    });

    it('minimizeEventDetails', () => {
        expect(eventsUi.minimizeEventDetails()).toEqual({type: 'CLOSE_EVENT_DETAILS'});
    });

    it('unlockAndCloseEditor', (done) => {
        store.initialState.events.highlightedEvent = 'e1';
        data.events[0].lock_user = store.initialState.session.identity._id;
        data.events[0].lock_session = store.initialState.session.sessionId;

        store.test(done, eventsUi.unlockAndCloseEditor(data.events[0]))
            .then(() => {
                expect(eventsApi.unlock.callCount).toBe(1);
                expect(store.dispatch.callCount).toBe(2);
                expect(store.dispatch.args[1]).toEqual([{type: 'CLOSE_EVENT_DETAILS'}]);
                expect(services.notify.error.callCount).toBe(0);
                done();
            });
    });

    describe('publishEvent', () => {
        const event = {
            _id: 'e1',
            dates: {start: moment('2099-10-15T12:30+0000')},
            _recurring: [
                {
                    _id: 'e1',
                    dates: {start: moment('2099-10-15T12:30+0000')},
                },
                {
                    _id: 'e2',
                    dates: {start: moment('2099-10-16T12:30+0000')},
                },
                {
                    _id: 'e3',
                    dates: {start: moment('2099-10-17T12:30+0000')},
                },
                {
                    _id: 'e4',
                    dates: {start: moment('2099-10-18T12:30+0000')},
                },
                {
                    _id: 'e5',
                    dates: {start: moment('2099-10-19T12:30+0000')},
                },
                {
                    _id: 'e6',
                    dates: {start: moment('2099-10-20T12:30+0000')},
                },
            ],
        };

        it('publishes a single event', (done) => (
            store.test(done, eventsUi.publishEvent(data.events[0]))
                .then((publishedEvent) => {
                    expect(publishedEvent).toEqual(data.events[0]);

                    expect(eventsApi.publishEvent.callCount).toBe(1);
                    expect(eventsApi.publishEvent.args[0]).toEqual([data.events[0]]);

                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['The event has been published']);

                    expect(eventsUi.closeEventDetails.callCount).toBe(1);

                    done();
                })
        ));

        it('publishes all events in a series of recurring events', (done) => (
            store.test(done, eventsUi.publishEvent({
                ...event,
                update_method: {value: 'all'},
            }))
                .then((publishedEvents) => {
                    expect(publishedEvents).toEqual(event._recurring);

                    expect(eventsApi.publishEvent.callCount).toBe(6);
                    expect(eventsApi.publishEvent.args[0]).toEqual([event._recurring[0]]);
                    expect(eventsApi.publishEvent.args[1]).toEqual([event._recurring[1]]);
                    expect(eventsApi.publishEvent.args[2]).toEqual([event._recurring[2]]);
                    expect(eventsApi.publishEvent.args[3]).toEqual([event._recurring[3]]);
                    expect(eventsApi.publishEvent.args[4]).toEqual([event._recurring[4]]);
                    expect(eventsApi.publishEvent.args[5]).toEqual([event._recurring[5]]);

                    expect(services.notify.pop.callCount).toBe(2);
                    expect(services.notify.success.callCount).toBe(2);
                    expect(services.notify.success.args[0]).toEqual(['Published 5/6 Events']);
                    expect(services.notify.success.args[1]).toEqual(['Published 6 Events']);

                    expect(eventsUi.closeEventDetails.callCount).toBe(1);

                    done();
                })
        ));

        it('publishes future events in a series of recurring events', (done) => (
            store.test(done, eventsUi.publishEvent({
                ...event,
                _id: 'e3',
                dates: {start: moment('2099-10-17T12:30+0000')},
                update_method: {value: 'future'},
            }))
                .then((publishedEvents) => {
                    expect(publishedEvents).toEqual([
                        event._recurring[2],
                        event._recurring[3],
                        event._recurring[4],
                        event._recurring[5],
                    ]);

                    expect(eventsApi.publishEvent.callCount).toBe(4);
                    expect(eventsApi.publishEvent.args[0]).toEqual([event._recurring[2]]);
                    expect(eventsApi.publishEvent.args[1]).toEqual([event._recurring[3]]);
                    expect(eventsApi.publishEvent.args[2]).toEqual([event._recurring[4]]);
                    expect(eventsApi.publishEvent.args[3]).toEqual([event._recurring[5]]);

                    expect(services.notify.pop.callCount).toBe(1);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Published 4 Events']);

                    expect(eventsUi.closeEventDetails.callCount).toBe(1);

                    done();
                })
        ));
    });

    describe('fetchEvents', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'query').returns(Promise.resolve(data.events));
            sinon.stub(eventsApi, 'receiveEvents').returns({type: 'RECEIVE_EVENTS'});
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.query);
            restoreSinonStub(eventsApi.receiveEvents);
        });

        it('ids', (done) => (
            store.test(done, eventsUi.fetchEvents({ids: ['e1', 'e2', 'e3']}))
                .then((response) => {
                    expect(store.dispatch.callCount).toBe(4);
                    expect(eventsApi.query.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsUi.setEventsList.callCount).toBe(1);
                    expect(response).toEqual(data.events);
                    done();
                })
        ));
    });

    describe('unpublish', () => {
        afterEach(() => {
            restoreSinonStub(eventsApi.unpublish);
        });

        it('calls events.api.unpublish and notifies the user of success', (done) => {
            sinon.stub(eventsApi, 'unpublish').returns(Promise.resolve(data.events[0]));
            store.test(done, eventsUi.unpublish(data.events[0]))
                .then(() => {
                    expect(eventsApi.unpublish.callCount).toBe(1);
                    expect(eventsApi.unpublish.args[0]).toEqual([data.events[0]]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['The Event has been published']);
                    done();
                });
        });

        it('calls events.api.unpublish and notifies the user of failure', (done) => {
            sinon.stub(eventsApi, 'unpublish').callsFake(() => Promise.reject(errorMessage));
            store.test(done, eventsUi.unpublish(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });
});