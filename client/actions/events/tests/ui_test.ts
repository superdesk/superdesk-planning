import {omit} from 'lodash';
import sinon from 'sinon';
import moment from 'moment';

import {LIST_VIEW_TYPE} from '../../../interfaces';
import eventsApi from '../api';
import eventsUi from '../ui';
import planningApi from '../../planning/api';
import {main} from '../../';
import {MAIN, EVENTS, ITEM_TYPE} from '../../../constants';

import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';

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

        sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
            () => (Promise.resolve(data.plannings))
        );

        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve([])));

        sinon.stub(eventsUi, 'setEventsList').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsApi, 'loadEventDataForAction').callsFake(
            (event) => (Promise.resolve(event))
        );

        sinon.stub(eventsApi, 'lock').callsFake((item) => (Promise.resolve(item)));
        sinon.stub(eventsApi, 'unlock').callsFake((item) => (Promise.resolve(item)));

        sinon.stub(eventsApi, 'rescheduleEvent').callsFake(() => (Promise.resolve()));

        sinon.stub(eventsUi, '_openActionModalFromEditor');
    });

    afterEach(() => {
        restoreSinonStub(eventsApi.fetch);
        restoreSinonStub(eventsApi.spike);
        restoreSinonStub(eventsApi.unspike);
        restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
        restoreSinonStub(eventsApi.refetch);
        restoreSinonStub(eventsUi._openActionModal);
        restoreSinonStub(eventsUi.refetch);
        restoreSinonStub(eventsUi.setEventsList);
        restoreSinonStub(eventsApi.loadEventDataForAction);
        restoreSinonStub(eventsApi.lock);
        restoreSinonStub(eventsApi.unlock);
        restoreSinonStub(eventsApi.rescheduleEvent);
        restoreSinonStub(planningApi.loadPlanningByEventId);
        restoreSinonStub(planningApi.fetch);
        restoreSinonStub(eventsUi._openActionModalFromEditor);
    });

    it('openSpikeModal calls `_openActionModal`', (done) => (
        store.test(done, eventsUi.openSpikeModal(data.events[1]))
            .then(() => {
                expect(eventsUi._openActionModal.callCount).toBe(1);
                expect(eventsUi._openActionModal.args[0]).toEqual([
                    data.events[1],
                    {},
                    'onSpikeEvent',
                    null,
                    true,
                    false,
                    false,
                    true,
                    {},
                ]);

                done();
            })
    ).catch(done.fail));

    it('openCancelModal calls `_openActionModalFromEditor`', () => {
        eventsUi.openCancelModal(data.events[1]);

        expect(eventsUi._openActionModalFromEditor.callCount).toBe(1);
        expect(eventsUi._openActionModalFromEditor.args[0]).toEqual([{
            event: data.events[1],
            action: EVENTS.ITEM_ACTIONS.CANCEL_EVENT,
            title: 'Save changes before cancelling the Event?',
            loadPlannings: true,
            post: false,
            large: true,
            loadEvents: true,
            refetchBeforeFinalLock: true,
        }]);
    });

    it('openPostponeModal calls `_openActionModalFromEditor`', () => {
        eventsUi.openPostponeModal(data.events[1]);

        expect(eventsUi._openActionModalFromEditor.callCount).toBe(1);
        expect(eventsUi._openActionModalFromEditor.args[0]).toEqual([{
            event: data.events[1],
            action: EVENTS.ITEM_ACTIONS.POSTPONE_EVENT,
            title: 'Save changes before postponing the Event?',
            loadPlannings: true,
            post: false,
            large: false,
            loadEvents: false,
        }]);
    });

    it('openUpdateTimeModal calls `_openActionModalFromEditor`', () => {
        eventsUi.openUpdateTimeModal(data.events[1]);

        expect(eventsUi._openActionModalFromEditor.callCount).toBe(1);
        expect(eventsUi._openActionModalFromEditor.args[0]).toEqual([{
            event: data.events[1],
            action: EVENTS.ITEM_ACTIONS.UPDATE_TIME,
            title: 'Save changes before updating the Event\'s time?',
            loadPlannings: false,
            post: false,
            large: false,
            loadEvents: true,
        }]);
    });

    it('openRescheduleModal calls `_openActionModalFromEditor`', () => {
        eventsUi.openRescheduleModal(data.events[1]);

        expect(eventsUi._openActionModalFromEditor.callCount).toBe(1);
        expect(eventsUi._openActionModalFromEditor.args[0]).toEqual([{
            event: data.events[1],
            action: EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT,
            title: 'Save changes before rescheduling the Event?',
            loadPlannings: true,
            post: false,
            large: true,
            loadEvents: false,
        }]);
    });

    it('openRepetitionsModal calls `_openActionModalFromEditor`', () => {
        eventsUi.openRepetitionsModal(data.events[1]);

        expect(eventsUi._openActionModalFromEditor.callCount).toBe(1);
        expect(eventsUi._openActionModalFromEditor.args[0]).toEqual([{
            event: data.events[1],
            action: EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS,
            title: 'Save changes before updating Event Repetitions?',
            refetchBeforeFinalLock: true,
        }]);
    });

    describe('openActionModal', () => {
        beforeEach(() => {
            restoreSinonStub(eventsUi._openActionModal);
        });

        it('openActionModal locks event, calls loadEventDataForAction then shows modal', (done) => (
            store.test(done, eventsUi._openActionModal(
                data.events[1],
                {},
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
                    true,
                ]);

                expect(store.dispatch.callCount).toBe(2);
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'ITEM_ACTIONS_MODAL',
                    modalProps: {
                        original: data.events[1],
                        updates: {},
                        actionType: 'Cancel Event',
                        large: false,
                    },
                }]);

                done();
            })
        ).catch(done.fail));

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
            })
                .catch(done.fail);
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
            })
                .catch(done.fail);
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
        ).catch(done.fail));

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
                })
                .catch(done.fail);
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
        ).catch(done.fail));

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
                })
                .catch(done.fail);
        });
    });

    it('setEventsList', (done) => {
        restoreSinonStub(eventsUi.setEventsList);
        store.test(done, eventsUi.setEventsList(['e1', 'e2']));
        expect(store.dispatch.callCount).toBe(1);
        expect(store.dispatch.args[0]).toEqual([{
            type: 'SET_EVENTS_LIST',
            payload: {
                listViewType: LIST_VIEW_TYPE.SCHEDULE,
                ids: ['e1', 'e2'],
            },
        }]);

        done();
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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });

        it('doesnt refetch events if main filter is not EVENTS', (done) => {
            restoreSinonStub(eventsUi.refetch);
            store.initialState.main.filter = MAIN.FILTERS.COMBINED;

            return store.test(done, eventsUi.refetch())
                .then((events) => {
                    expect(events).toEqual([]);

                    expect(eventsApi.refetch.callCount).toBe(0);

                    done();
                })
                .catch(done.fail);
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
        ).catch(done.fail));
    });

    describe('duplicate', () => {
        beforeEach(() => {
            sinon.stub(main, 'createNew');
            sinon.stub(eventsApi, 'fetchEventFiles').callsFake((item) => Promise.resolve(item));
            sinon.stub(moment.tz, 'guess').callsFake(() => 'Australia/Sydney');
        });

        afterEach(() => {
            restoreSinonStub(main.createNew);
            restoreSinonStub(eventsApi.duplicate);
            restoreSinonStub(eventsApi.fetchEventFiles);
            restoreSinonStub(moment.tz.guess);
        });

        it('duplicate updates past event date to current date and preserves files and links', () => {
            data.events[0].dates.start = moment(data.events[0].dates.start);
            data.events[0].dates.end = moment(data.events[0].dates.end);
            data.events[0].files = ['file1_id'];
            data.events[0].links = ['http://www.google.com'];

            store.test(null, eventsUi.duplicate(data.events[0]));

            const daysBetween = moment().diff(data.events[0].dates.start, 'days');
            const newStartDate = data.events[0].dates.start.add(daysBetween, 'days');
            const newEndDate = data.events[0].dates.end.add(daysBetween, 'days');
            const args = main.createNew.args[0];

            expect(main.createNew.callCount).toBe(1);
            expect(args[0]).toEqual(ITEM_TYPE.EVENT);
            expect(args[1]).toEqual({
                ...omit(data.events[0], ['_id', '_etag', 'planning_ids']),
                dates: {
                    start: jasmine.any(moment),
                    end: jasmine.any(moment),
                    tz: 'Australia/Sydney',
                },
                duplicate_from: 'e1',
                state: 'draft',
                occur_status: {
                    name: 'Planned, occurs certainly',
                    label: 'Confirmed',
                    qcode: 'eocstat:eos5',
                },
                files: ['file1_id'],
                links: ['http://www.google.com'],
                _startTime: jasmine.any(moment),
                _endTime: jasmine.any(moment),
            });

            expect(args[1].dates.start.format()).toEqual(newStartDate.format());
            expect(args[1].dates.end.format()).toEqual(newEndDate.format());
            expect(args[1]._startTime.format()).toEqual(newStartDate.format());
            expect(args[1]._endTime.format()).toEqual(newEndDate.format());
        });
    });

    describe('rescheduleEvent', () => {
        beforeEach(() => {
            // sinon.stub(main, 'lockAndEdit').callsFake((item) => Promise.resolve(item));
            sinon.stub(main, 'openForEdit');
            sinon.stub(eventsApi, 'fetchById').callsFake(() => Promise.resolve(data.events[1]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            // restoreSinonStub(main.lockAndEdit);
            restoreSinonStub(main.openForEdit);
            restoreSinonStub(eventsApi.fetchById);
        });

        it('reschedule not in use Event', (done) => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            sinon.stub(eventsApi, 'rescheduleEvent').callsFake((item) => Promise.resolve(item));
            store.test(done, eventsUi.rescheduleEvent(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(eventsApi.fetchById.callCount).toBe(0);

                    expect(main.openForEdit.callCount).toBe(1);
                    expect(main.openForEdit.args[0]).toEqual([data.events[0]]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Event has been rescheduled']);

                    done();
                })
                .catch(done.fail);
        });

        it('reschedule in use Event', (done) => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            sinon.stub(eventsApi, 'rescheduleEvent').callsFake((item) => Promise.resolve({
                ...item,
                reschedule_to: 'e2',
                state: 'rescheduled',
            }));
            store.test(done, eventsUi.rescheduleEvent(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[1]);

                    expect(eventsApi.fetchById.callCount).toBe(1);
                    expect(eventsApi.fetchById.args[0]).toEqual(['e2']);

                    expect(main.openForEdit.callCount).toBe(1);
                    expect(main.openForEdit.args[0]).toEqual([data.events[1]]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Event has been rescheduled']);

                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });

        it('on fetchById error notify the user of the failure', (done) => {
            restoreSinonStub(eventsApi.rescheduleEvent);
            restoreSinonStub(eventsApi.fetchById);
            sinon.stub(eventsApi, 'rescheduleEvent').callsFake((item) => Promise.resolve({
                ...item,
                reschedule_to: 'e2',
                state: 'rescheduled',
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
                })
                .catch(done.fail);
        });
    });

    describe('updateRepetitions', () => {
        afterEach(() => {
            restoreSinonStub(eventsApi.updateRepetitions);
        });

        it('updateRepetitions calls events.api.updateRepetitions and notifies the user of success', (done) => {
            sinon.stub(eventsApi, 'updateRepetitions').callsFake((item) => Promise.resolve(item));
            store.test(done, eventsUi.updateRepetitions(data.events[0], {dates: {}}))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(eventsApi.updateRepetitions.callCount).toBe(1);
                    expect(eventsApi.updateRepetitions.args[0]).toEqual([
                        data.events[0],
                        {dates: {}},
                    ]);

                    expect(services.notify.error.callCount).toBe(0);
                    expect(services.notify.success.callCount).toBe(1);
                    expect(services.notify.success.args[0]).toEqual(['Event repetitions updated']);

                    done();
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });
    });

    describe('createEventFromPlanning', () => {
        beforeEach(() => {
            sinon.stub(planningApi, 'lock').callsFake((item) => Promise.resolve(item));
            sinon.stub(main, 'createNew').callsFake((item) => Promise.resolve(item));
        });

        afterEach(() => {
            restoreSinonStub(planningApi.lock);
            restoreSinonStub(main.createNew);
        });

        it('locks the Planning item and opens the Event Editor', (done) => {
            const plan = data.plannings[0];

            store.test(done, eventsUi.createEventFromPlanning(plan))
                .then(() => {
                    expect(planningApi.lock.callCount).toBe(1);
                    expect(planningApi.lock.args[0]).toEqual([plan, 'add_as_event']);

                    expect(main.createNew.callCount).toBe(1);
                    const args = main.createNew.args[0];

                    expect(args[0]).toEqual('event');
                    expect(args[1]).toEqual(jasmine.objectContaining({
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
                            name: 'Unplanned event',
                        },
                        _planning_item: plan._id,
                    }));

                    expect(moment(args[1].dates.start).isSame(moment('2016-10-15T13:01:11+0000'))).toBeTruthy();
                    expect(moment(args[1].dates.end).isSame(moment('2016-10-15T14:01:11+0000'))).toBeTruthy();
                    expect(args[1].dates.tz).toBe(moment.tz.guess());

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('selectCalendar', () => {
        beforeEach(() => {
            sinon.stub(eventsUi, 'fetchEvents').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.fetchEvents);
        });

        it('selects default Calendar', (done) => (
            store.test(done, eventsUi.selectCalendar())
                .then(() => {
                    expect(store.dispatch.callCount).toBe(4);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'SELECT_EVENT_CALENDAR',
                        payload: 'ALL_CALENDARS',
                    }]);

                    expect(services.$timeout.callCount).toBe(1);
                    expect(services.$location.search.callCount).toBe(1);
                    expect(services.$location.search.args[0]).toEqual(['calendar', 'ALL_CALENDARS']);

                    expect(eventsUi.fetchEvents.callCount).toBe(1);
                    expect(eventsUi.fetchEvents.args[0]).toEqual([{}]);

                    done();
                })
        ).catch(done.fail));

        it('selects specific calendar and passes params to fetchEvents', (done) => (
            store.test(done, eventsUi.selectCalendar('cal1', {fulltext: 'search text'}))
                .then(() => {
                    expect(store.dispatch.callCount).toBe(4);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'SELECT_EVENT_CALENDAR',
                        payload: 'cal1',
                    }]);

                    expect(services.$timeout.callCount).toBe(1);
                    expect(services.$location.search.callCount).toBe(1);
                    expect(services.$location.search.args[0]).toEqual(['calendar', 'cal1']);

                    expect(eventsUi.fetchEvents.callCount).toBe(1);
                    expect(eventsUi.fetchEvents.args[0]).toEqual([{fulltext: 'search text'}]);

                    done();
                })
        ).catch(done.fail));
    });
});
