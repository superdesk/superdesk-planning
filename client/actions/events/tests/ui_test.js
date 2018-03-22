import eventsApi from '../api';
import eventsUi from '../ui';
import planningApi from '../../planning/api';
import {main} from '../../';
import {PRIVILEGES, MAIN} from '../../../constants';
import sinon from 'sinon';
import moment from 'moment';
import {getTestActionStore, restoreSinonStub, expectAccessDenied} from '../../../utils/testUtils';

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

        sinon.stub(eventsApi, 'refetch').callsFake(() => (Promise.resolve()));

        sinon.stub(eventsUi, '_openActionModal').callsFake(
            () => (Promise.resolve())
        );

        sinon.stub(eventsUi, 'refetch').callsFake(() => (Promise.resolve()));
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
    });

    afterEach(() => {
        restoreSinonStub(eventsApi.fetch);
        restoreSinonStub(eventsApi.spike);
        restoreSinonStub(eventsApi.unspike);
        restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
        restoreSinonStub(eventsApi.loadRecurringEventsAndPlanningItems);
        restoreSinonStub(eventsApi.refetch);
        restoreSinonStub(eventsUi._openActionModal);
        restoreSinonStub(eventsUi.refetch);
        restoreSinonStub(eventsUi.setEventsList);
        restoreSinonStub(eventsUi._openEventDetails);
        restoreSinonStub(eventsUi.closeEventDetails);
        restoreSinonStub(eventsApi.loadEventDataForAction);
        restoreSinonStub(eventsApi.lock);
        restoreSinonStub(eventsApi.unlock);
        restoreSinonStub(eventsApi.rescheduleEvent);
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
                    'cancel',
                    true,
                    false,
                    true
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
                    'postpone',
                    true,
                    false,
                    false,
                    false
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
                    false
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
                    'reschedule',
                    true,
                    false,
                    true,
                    false
                ]);

                done();
            })
    ));

    it('openRepetitionsModal calls `_openActionModal`', (done) => (
        store.test(done, eventsUi.openRepetitionsModal(data.events[1]))
            .then(() => {
                expect(eventsUi._openActionModal.callCount).toBe(1);
                expect(eventsUi._openActionModal.args[0]).toEqual([
                    data.events[1],
                    'Update Repetitions',
                    'update_repetitions',
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
                'cancel',
                true,
                false
            )).then(() => {
                expect(eventsApi.lock.callCount).toBe(1);
                expect(eventsApi.lock.args[0]).toEqual([data.events[1], 'cancel']);

                expect(eventsApi.loadEventDataForAction.callCount).toBe(1);
                expect(eventsApi.loadEventDataForAction.args[0]).toEqual([
                    data.events[1],
                    true,
                    false,
                    true
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
                'cancel',
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
                'cancel',
                true,
                false
            )).then(() => { /* no-op */ }, (error) => {
                expect(error).toEqual(errorMessage);
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
                .then(null, (error) => {
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
                .then(null, (error) => {
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
            restoreSinonStub(eventsApi.refetch);
            restoreSinonStub(eventsUi.refetch);

            sinon.stub(eventsApi, 'refetch').callsFake(
                () => (Promise.resolve(data.events))
            );

            store.initialState.main.filter = MAIN.FILTERS.EVENTS;

            return store.test(done, eventsUi.refetch())
                .then((events) => {
                    expect(events).toEqual(data.events);

                    expect(eventsApi.refetch.callCount).toBe(1);

                    expect(eventsUi.setEventsList.callCount).toBe(1);
                    expect(eventsUi.setEventsList.args[0]).toEqual([['e1', 'e2', 'e3']]);

                    done();
                });
        });

        it('notifies user if api.refetchEvents fails', (done) => {
            restoreSinonStub(eventsApi.refetch);
            restoreSinonStub(eventsUi.refetch);

            sinon.stub(eventsApi, 'refetch').callsFake(
                () => (Promise.reject(errorMessage))
            );

            store.initialState.main.filter = MAIN.FILTERS.EVENTS;

            return store.test(done, eventsUi.refetch())
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });

        it('doesnt refetch events if main filter is not EVENTS', (done) => {
            restoreSinonStub(eventsUi.refetch);
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;

            return store.test(done, eventsUi.refetch())
                .then((events) => {
                    expect(events).toEqual([]);

                    expect(eventsApi.refetch.callCount).toBe(0);

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

    describe('duplicate', () => {
        beforeEach(() => {
            sinon.stub(main, 'lockAndEdit').callsFake((item) => Promise.resolve(item));
        });

        afterEach(() => {
            restoreSinonStub(main.lockAndEdit);
            restoreSinonStub(eventsApi.duplicate);
        });

        it('duplicate calls events.api.duplicate and notifies the user of success', (done) => {
            sinon.stub(eventsApi, 'duplicate').callsFake((item) => Promise.resolve(item));
            store.test(done, eventsUi.duplicate(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(eventsApi.duplicate.callCount).toBe(1);
                    expect(eventsApi.duplicate.args[0]).toEqual([data.events[0]]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Event duplicated']);

                    expect(main.lockAndEdit.callCount).toBe(1);
                    expect(main.lockAndEdit.args[0]).toEqual([data.events[0]]);

                    done();
                });
        });

        it('on duplicate error notify the user of the failure', (done) => {
            sinon.stub(eventsApi, 'duplicate').callsFake(() => Promise.reject(errorMessage));
            store.test(done, eventsUi.duplicate(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('rescheduleEvent', () => {
        beforeEach(() => {
            sinon.stub(main, 'lockAndEdit').callsFake((item) => Promise.resolve(item));
            sinon.stub(eventsApi, 'fetchById').callsFake(() => Promise.resolve(data.events[1]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            restoreSinonStub(main.lockAndEdit);
            restoreSinonStub(eventsApi.fetchById);
        });

        it('reschedule not in use Event', (done) => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            sinon.stub(eventsApi, 'rescheduleEvent').callsFake((item) => Promise.resolve(item));
            store.test(done, eventsUi.rescheduleEvent(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(eventsApi.fetchById.callCount).toBe(0);

                    expect(main.lockAndEdit.callCount).toBe(1);
                    expect(main.lockAndEdit.args[0]).toEqual([data.events[0]]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Event has been rescheduled']);

                    done();
                });
        });

        it('reschedule in use Event', (done) => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            sinon.stub(eventsApi, 'rescheduleEvent').callsFake((item) => Promise.resolve({
                ...item,
                reschedule_to: 'e2',
                state: 'rescheduled'
            }));
            store.test(done, eventsUi.rescheduleEvent(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[1]);

                    expect(eventsApi.fetchById.callCount).toBe(1);
                    expect(eventsApi.fetchById.args[0]).toEqual(['e2']);

                    expect(main.lockAndEdit.callCount).toBe(1);
                    expect(main.lockAndEdit.args[0]).toEqual([data.events[1]]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Event has been rescheduled']);

                    done();
                });
        });

        it('on reschedule error notify the user of the failure', (done) => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            sinon.stub(eventsApi, 'rescheduleEvent').callsFake((item) => Promise.reject(errorMessage));

            store.test(done, eventsUi.rescheduleEvent(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });

        it('on fetchById error notify the user of the failure', (done) => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            restoreSinonStub(eventsApi.fetchById);
            sinon.stub(eventsApi, 'rescheduleEvent').callsFake((item) => Promise.resolve({
                ...item,
                reschedule_to: 'e2',
                state: 'rescheduled'
            }));
            sinon.stub(eventsApi, 'fetchById').callsFake((item) => Promise.reject(errorMessage));

            store.test(done, eventsUi.rescheduleEvent(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);

                    // The Event was successfully rescheduled
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Event has been rescheduled']);

                    // But failed to open the new item
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('updateRepetitions', () => {
        afterEach(() => {
            restoreSinonStub(eventsApi.updateRepetitions);
        });

        it('updateRepetitions calls events.api.updateRepetitions and notifies the user of success', (done) => {
            sinon.stub(eventsApi, 'updateRepetitions').callsFake((item) => Promise.resolve(item));
            store.test(done, eventsUi.updateRepetitions(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(eventsApi.updateRepetitions.callCount).toBe(1);
                    expect(eventsApi.updateRepetitions.args[0]).toEqual([data.events[0]]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Event repetitions updated']);

                    done();
                });
        });

        it('on updateRepetitions error notify the user of the failure', (done) => {
            sinon.stub(eventsApi, 'updateRepetitions').callsFake((item) => Promise.reject(errorMessage));
            store.test(done, eventsUi.updateRepetitions(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.success.callCount).toBe(0);
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('createEventFromPlanning', () => {
        beforeEach(() => {
            sinon.stub(planningApi, 'lock').callsFake((item) => Promise.resolve(item));
            sinon.stub(main, 'lockAndEdit').callsFake((item) => Promise.resolve(item));
        });

        afterEach(() => {
            restoreSinonStub(planningApi.lock);
            restoreSinonStub(main.lockAndEdit);
        });

        it('locks the Planning item and opens the Event Editor', (done) => {
            const plan = data.plannings[0];

            store.test(done, eventsUi.createEventFromPlanning(plan))
                .then(() => {
                    expect(planningApi.lock.callCount).toBe(1);
                    expect(planningApi.lock.args[0]).toEqual([plan, 'add_as_event']);

                    expect(main.lockAndEdit.callCount).toBe(1);
                    const args = main.lockAndEdit.args[0][0];

                    expect(args).toEqual(jasmine.objectContaining({
                        type: 'event',

                        slugline: plan.slugline,
                        name: plan.slugline,
                        subject: plan.subject,
                        anpa_category: plan.anpa_category,
                        definition_short: plan.description_text,
                        calendars: [],
                        internal_note: plan.internal_note,
                        place: plan.place,
                        occur_status: {
                            label: 'Unplanned',
                            qcode: 'eocstat:eos0',
                            name: 'Unplanned event'
                        },
                        _planning_item: plan._id
                    }));

                    expect(moment(args.dates.start).isSame(moment('2016-10-15T13:01:11+0000'))).toBeTruthy();
                    expect(moment(args.dates.end).isSame(moment('2016-10-15T14:01:11+0000'))).toBeTruthy();
                    expect(args.dates.tz).toBe(moment.tz.guess());

                    done();
                });
        });
    });
});