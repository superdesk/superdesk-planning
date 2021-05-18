import sinon from 'sinon';
import moment from 'moment';
import {omit} from 'lodash';

import {appConfig} from 'appConfig';

import {eventUtils, timeUtils, createTestStore} from '../../../utils';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {SPIKED_STATE, MAIN, EVENTS} from '../../../constants';
import * as selectors from '../../../selectors';

import eventsApi from '../api';
import planningApi from '../../planning/api';
import {planningApis} from '../../../api';

describe('actions.events.api', () => {
    let errorMessage;
    let store;
    let services;
    let data;

    beforeEach(() => {
        errorMessage = {data: {_message: 'Failed!'}};
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        sinon.stub(eventsApi, 'query').callsFake(
            () => (Promise.resolve({_items: data.events}))
        );
        sinon.stub(eventsApi, 'refetch').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsApi, 'receiveEvents').callsFake(() => (Promise.resolve()));
        sinon.stub(eventsApi, 'loadEventsByRecurrenceId').callsFake(
            () => (Promise.resolve(data.events))
        );

        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve()));
        sinon.stub(planningApi, 'loadPlanningByEventId').callsFake(
            () => (Promise.resolve(data.plannings))
        );
        sinon.stub(planningApi, 'loadPlanningByRecurrenceId').callsFake(
            () => (Promise.resolve(data.plannings))
        );

        sinon.stub(timeUtils, 'localTimeZone').callsFake(
            () => appConfig.defaultTimezone
        );

        sinon.stub(planningApis.events, 'search').callsFake(
            () => Promise.resolve({_items: eventUtils.modifyEventsForClient(data.events)})
        );
        sinon.stub(planningApis.events, 'getById').callsFake(
            () => Promise.resolve(eventUtils.modifyEventsForClient(data.events)[0])
        );
        sinon.stub(planningApis.events, 'getByIds').callsFake(
            () => Promise.resolve(eventUtils.modifyEventsForClient(data.events))
        );
    });

    afterEach(() => {
        restoreSinonStub(eventsApi.query);
        restoreSinonStub(eventsApi.refetch);
        restoreSinonStub(eventsApi.receiveEvents);
        restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
        restoreSinonStub(planningApi.fetch);
        restoreSinonStub(planningApi.loadPlanningByEventId);
        restoreSinonStub(planningApi.loadPlanningByRecurrenceId);
        restoreSinonStub(timeUtils.localTimeZone);
        restoreSinonStub(planningApis.events.search);
        restoreSinonStub(planningApis.events.getById);
        restoreSinonStub(planningApis.events.getByIds);
    });

    it('silentlyFetchEventsById', (done) => {
        store.test(done, eventsApi.silentlyFetchEventsById(['e1', 'e2', 'e3'], 'both'))
            .then(() => {
                expect(planningApis.events.getByIds.callCount).toBe(1);
                expect(planningApis.events.getByIds.args[0]).toEqual([
                    ['e1', 'e2', 'e3'],
                    'both',
                ]);

                expect(eventsApi.receiveEvents.callCount).toBe(1);
                expect(eventsApi.receiveEvents.args[0]).toEqual([data.events]);

                done();
            })
            .catch(done.fail);
    });

    describe('fetchById', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'loadAssociatedPlannings').callsFake(() => Promise.resolve());
            restoreSinonStub(planningApis.events.getById);
            sinon.stub(planningApis.events, 'getById').callsFake(() => Promise.resolve(data.events[1]));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.loadAssociatedPlannings);
            restoreSinonStub(planningApis.events.getById);
        });

        it('returns the Events from the API (with default options)', (done) => {
            store.init();
            // Clear the store so that the Event is loaded via an api call
            store.initialState.events.events = {};
            store.test(done, eventsApi.fetchById('e2'))
                .then(() => {
                    expect(planningApis.events.getById.callCount).toBe(1);
                    expect(planningApis.events.getById.args[0]).toEqual(['e2']);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.args[0]).toEqual([[data.events[1]]]);
                    expect(eventsApi.loadAssociatedPlannings.callCount).toBe(1);

                    done();
                })
                .catch(done.fail);
        });

        it('returns the Event from the store instead of the API', (done) => (
            store.test(done, eventsApi.fetchById('e2'))
                .then((event) => {
                    const eventInStore = omit(eventUtils.modifyForClient(data.events[1]),
                        ['_startTime', '_endTime']);

                    expect(event).toEqual(eventInStore);

                    expect(services.api('events').getById.callCount).toBe(0);

                    expect(eventsApi.receiveEvents.callCount).toBe(0);
                    expect(eventsApi.loadAssociatedPlannings.callCount).toBe(1);

                    done();
                })
        ).catch(done.fail));

        it('returns the Event from the API if force = true', (done) => (
            store.test(done, eventsApi.fetchById('e2', {force: true}))
                .then((event) => {
                    expect(event).toEqual(eventUtils.modifyForClient(data.events[1]));

                    expect(planningApis.events.getById.callCount).toBe(1);
                    expect(planningApis.events.getById.args[0]).toEqual(['e2']);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.args[0]).toEqual([[data.events[1]]]);
                    expect(eventsApi.loadAssociatedPlannings.callCount).toBe(1);

                    done();
                })
        ).catch(done.fail));

        it('doesnt save to the store if saveToStore = false', (done) => (
            store.test(done, eventsApi.fetchById('e2', {saveToStore: false}))
                .then(() => {
                    expect(eventsApi.receiveEvents.callCount).toBe(0);
                    done();
                })
        ).catch(done.fail));

        it('doesnt load associated Planning if loadPlanning = false', (done) => (
            store.test(done, eventsApi.fetchById('e2', {loadPlanning: false}))
                .then(() => {
                    expect(eventsApi.loadAssociatedPlannings.callCount).toBe(0);
                    done();
                })
        ).catch(done.fail));

        it('returns rejected promise if API fails', (done) => {
            restoreSinonStub(planningApis.events.getById);
            sinon.stub(planningApis.events, 'getById').returns(Promise.reject(errorMessage));
            store.test(done, eventsApi.fetchById('e2', {force: true}))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
        });

        it('returns rejected promise if loadPlanning fails', (done) => {
            restoreSinonStub(eventsApi.loadAssociatedPlannings);
            sinon.stub(eventsApi, 'loadAssociatedPlannings').callsFake(() => Promise.reject(errorMessage));
            store.test(done, eventsApi.fetchById('e2', {force: true}))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('loadEventsByRecurrenceId', () => {
        beforeEach(() => {
            restoreSinonStub(eventsApi.loadEventsByRecurrenceId);
        });

        it('runs the query', (done) => (
            store.test(done, eventsApi.loadEventsByRecurrenceId('r1', SPIKED_STATE.NOT_SPIKED))
                .then((items) => {
                    expect(items).toEqual({_items: data.events});

                    expect(planningApis.events.search.callCount).toBe(1);
                    expect(planningApis.events.search.args[0]).toEqual([{
                        recurrence_id: 'r1',
                        spike_state: SPIKED_STATE.NOT_SPIKED,
                        page: 1,
                        max_results: 25,
                        only_future: false,
                        include_killed: true,
                    }]);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.args[0]).toEqual([{_items: data.events}]);

                    done();
                })
        ).catch(done.fail));

        it('returns Promise.reject if query fails', (done) => {
            restoreSinonStub(planningApis.events.search);
            sinon.stub(planningApis.events, 'search').returns(Promise.reject(errorMessage));
            store.test(done, eventsApi.loadEventsByRecurrenceId('r1'))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('spike', () => {
        beforeEach(() => {
            store.initialState.agenda.currentAgendaId = 'a2';
        });

        it('can spike a single event', (done) => (
            store.test(done, eventsApi.spike(data.events[1]))
                .then((items) => {
                    expect(items).toEqual([data.events[1]]);
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_spike',
                        data.events[1],
                        {update_method: EVENTS.UPDATE_METHODS[0].value},
                    ]);

                    done();
                })
        ).catch(done.fail));

        it('can spike multiple events', (done) => (
            store.test(done, eventsApi.spike(data.events))
                .then((items) => {
                    expect(items).toEqual(data.events);
                    expect(services.api.update.callCount).toBe(data.events.length);

                    for (let i = 0; i < data.events.length; i++) {
                        expect(services.api.update.args[i]).toEqual([
                            'events_spike',
                            data.events[i],
                            {update_method: EVENTS.UPDATE_METHODS[0].value},
                        ]);
                    }

                    done();
                })
        ).catch(done.fail));

        it('can send `future` for `update_method`', (done) => {
            data.events[1].update_method = 'future';
            return store.test(done, eventsApi.spike(data.events[1]))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_spike',
                        data.events[1],
                        {update_method: data.events[1].update_method},
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('returns Promise.reject if `events_spike` fails', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject(errorMessage)));
            return store.test(done, eventsApi.spike(data.events[1]))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('unspike', () => {
        it('can unspike a single event', (done) => (
            store.test(done, eventsApi.unspike(data.events[1]))
                .then((items) => {
                    expect(items).toEqual([data.events[1]]);

                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_unspike',
                        data.events[1],
                        {update_method: EVENTS.UPDATE_METHODS[0].value},
                    ]);

                    done();
                })
        ).catch(done.fail));

        it('can unspike multiple events', (done) => (
            store.test(done, eventsApi.unspike(data.events))
                .then((items) => {
                    expect(items).toEqual(data.events);

                    expect(services.api.update.callCount).toBe(data.events.length);
                    for (let i = 0; i < data.events.length; i++) {
                        expect(services.api.update.args[i]).toEqual([
                            'events_unspike',
                            data.events[i],
                            {update_method: EVENTS.UPDATE_METHODS[0].value},
                        ]);
                    }

                    done();
                })
        ).catch(done.fail));

        it('can send `future` for `update_method` when unspiking', (done) => {
            data.events[1].update_method = 'future';
            return store.test(done, eventsApi.unspike(data.events[1]))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_unspike',
                        data.events[1],
                        {update_method: data.events[1].update_method},
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('returns Promise.reject if `events_unspike` fails', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject(errorMessage)));
            return store.test(done, eventsApi.unspike(data.events))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('refetchEvents', () => {
        it('performs query', (done) => {
            store.initialState.main.filter = MAIN.FILTERS.EVENTS;
            restoreSinonStub(eventsApi.refetch);
            restoreSinonStub(eventsApi.query);
            sinon.stub(eventsApi, 'query').callsFake(
                () => (Promise.resolve(data.events))
            );

            return store.test(done, eventsApi.refetch())
                .then((events) => {
                    expect(events).toEqual(data.events);
                    expect(eventsApi.query.callCount).toBe(1);
                    expect(eventsApi.query.args[0]).toEqual([{page: 1}, true]);

                    expect(eventsApi.receiveEvents.callCount).toBe(1);
                    expect(eventsApi.receiveEvents.args[0]).toEqual([data.events, []]);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('fetchEventHistory', () => {
        it('calls events_history api and runs dispatch', (done) => {
            store.test(done, eventsApi.fetchEventHistory('e2'))
                .then((data) => {
                    expect(data).toEqual(store.data.events_history);
                    expect(store.services.api('events_history').query.callCount).toBe(1);
                    expect(store.services.api('events_history').query.args[0]).toEqual([{
                        where: {event_id: 'e2'},
                        max_results: 200,
                        sort: '[(\'_created\', 1)]',
                    }]);
                    done();
                })
                .catch(done.fail);
        });
    });

    it('receiveEvents', () => {
        restoreSinonStub(eventsApi.receiveEvents);
        expect(eventsApi.receiveEvents(data.events)).toEqual(jasmine.objectContaining({
            type: 'ADD_EVENTS',
            payload: data.events,
        }));
    });

    describe('rescheduleEvent', () => {
        it('can reschedule an event', (done) => {
            store.test(done, eventsApi.rescheduleEvent(data.events[1], {
                dates: {
                    start: '2014-10-16T14:01:11+0000',
                    end: '2014-10-16T15:01:11+0000',
                    tz: 'Australia/Sydney',
                },
                reason: 'Changing the day',
            }))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_reschedule',
                        data.events[1],
                        {
                            dates: {
                                start: '2014-10-16T14:01:11+0000',
                                end: '2014-10-16T15:01:11+0000',
                                tz: 'Australia/Sydney',
                            },
                            update_method: 'single',
                            reason: 'Changing the day',
                        },
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('can send `future` when rescheduling', (done) => {
            store.test(done, eventsApi.rescheduleEvent(data.events[1], {
                dates: {
                    start: '2014-10-16T14:01:11+0000',
                    end: '2014-10-16T15:01:11+0000',
                    tz: 'Australia/Sydney',
                },
                reason: 'Changing the day',
                update_method: {value: 'future'},
            }))
                .then(() => {
                    expect(services.api.update.callCount).toBe(1);
                    expect(services.api.update.args[0]).toEqual([
                        'events_reschedule',
                        data.events[1],
                        {
                            dates: {
                                start: '2014-10-16T14:01:11+0000',
                                end: '2014-10-16T15:01:11+0000',
                                tz: 'Australia/Sydney',
                            },
                            update_method: 'future',
                            reason: 'Changing the day',
                        },
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('returns Promise.reject if `events_reschedule` fails', (done) => {
            services.api.update = sinon.spy(() => (Promise.reject(errorMessage)));
            store.test(done, eventsApi.rescheduleEvent(data.events[1], {
                dates: {
                    start: '2014-10-16T14:01:11+0000',
                    end: '2014-10-16T15:01:11+0000',
                    tz: 'Australia/Sydney',
                },
            }))
                .then(() => { /* no-op */ }, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('loadAssociatedPlannings', () => {
        it('returns if no associated Planning items', (done) => (
            store.test(done, eventsApi.loadAssociatedPlannings(data.events[1]))
                .then((items) => {
                    expect(items).toEqual([]);
                    expect(planningApi.loadPlanningByEventId.callCount).toBe(0);

                    done();
                })
        ).catch(done.fail));

        it('loads associated Planning items', (done) => (
            store.test(done, eventsApi.loadAssociatedPlannings(data.events[0]))
                .then((items) => {
                    expect(items).toEqual(data.plannings);
                    expect(planningApi.loadPlanningByEventId.callCount).toBe(1);
                    expect(planningApi.loadPlanningByEventId.args[0]).toEqual([data.events[0]._id]);

                    done();
                })
        ).catch(done.fail));
    });

    describe('getEvent', () => {
        it('returns the Event if it is already in the store', (done) => (
            store.test(done, eventsApi.getEvent(data.events[0]._id))
                .then((event) => {
                    expect(event).toEqual({
                        ...data.events[0],
                        dates: {
                            ...data.events[0].dates,
                            start: moment(data.events[0].dates.start),
                            end: moment(data.events[0].dates.end),
                        },
                    });
                    expect(services.api('events').getById.callCount).toBe(0);

                    done();
                })
        ).catch(done.fail));

        it('loads the Event if it is not in the store', (done) => {
            store.init();
            store.initialState.events.events = {};
            store.test(done, eventsApi.getEvent(data.events[0]._id))
                .then((event) => {
                    expect(event).toEqual({
                        ...data.events[0],
                        dates: {
                            ...data.events[0].dates,
                            start: moment(data.events[0].dates.start),
                            end: moment(data.events[0].dates.end),
                        },
                    });

                    expect(planningApis.events.getByIds.callCount).toBe(1);
                    expect(planningApis.events.getByIds.args[0]).toEqual([
                        [data.events[0]._id],
                        'both',
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('returns Promise.reject if getById fails', (done) => {
            store.init();
            store.initialState.events.events = {};
            restoreSinonStub(planningApis.events.getByIds);
            sinon.stub(planningApis.events, 'getByIds').returns(Promise.reject(errorMessage));
            store.test(done, eventsApi.getEvent(data.events[0]._id))
                .then(
                    done.fail,
                    (error) => {
                        expect(error).toEqual(errorMessage);
                        done();
                    }
                )
                .catch(done.fail);
        });
    });

    it('post calls `events_post` endpoint', (done) => (
        store.test(done, eventsApi.post(data.events[0]))
            .then(() => {
                expect(services.api.save.callCount).toBe(1);
                expect(services.api.save.args[0]).toEqual([
                    'events_post',
                    {
                        event: data.events[0]._id,
                        etag: data.events[0]._etag,
                        pubstatus: 'usable',
                        update_method: 'single',
                    },
                ]);
                done();
            })
    ).catch(done.fail));

    it('unpost calls `events_post` endpoint', (done) => (
        store.test(done, eventsApi.unpost(data.events[0]))
            .then(() => {
                expect(services.api.save.callCount).toBe(1);
                expect(services.api.save.args[0]).toEqual([
                    'events_post',
                    {
                        event: data.events[0]._id,
                        etag: data.events[0]._etag,
                        pubstatus: 'cancelled',
                        update_method: 'single',
                    },
                ]);
                done();
            })
    ).catch(done.fail));

    describe('uploadFiles', () => {
        it('uploads files and dispatches RECEIVE_FILES', (done) => {
            data.events[0].files = [['test_file_1'], ['test_file_2']];
            store.test(done, eventsApi.uploadFiles(data.events[0]))
                .then((files) => {
                    expect(services.upload.start.callCount).toBe(2);
                    expect(services.upload.start.args[0]).toEqual([{
                        method: 'POST',
                        url: 'http://server.com/events_files/',
                        headers: {'Content-Type': 'multipart/form-data'},
                        data: {media: [data.events[0].files[0]]},
                        arrayKey: '',
                    }]);
                    expect(services.upload.start.args[1]).toEqual([{
                        method: 'POST',
                        url: 'http://server.com/events_files/',
                        headers: {'Content-Type': 'multipart/form-data'},
                        data: {media: [data.events[0].files[1]]},
                        arrayKey: '',
                    }]);

                    expect(files).toEqual([
                        {_id: 'test_file_1'},
                        {_id: 'test_file_2'},
                    ]);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'RECEIVE_FILES',
                        payload: [
                            {_id: 'test_file_1'},
                            {_id: 'test_file_2'},
                        ],
                    }]);
                    done();
                })
                .catch(done.fail);
        });

        it('returns Promise.reject if any upload fails', (done) => {
            data.events[0].files = [['test_file_1'], ['test_file_2']];
            services.upload.start = sinon.stub().returns(Promise.reject(errorMessage));
            store.test(done, eventsApi.uploadFiles(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                })
                .catch(done.fail);
        });

        it('returns if event has no files', (done) => (
            store.test(done, eventsApi.uploadFiles(data.events[0]))
                .then((files) => {
                    expect(files).toEqual([]);
                    expect(services.upload.start.callCount).toBe(0);
                    done();
                })
        ).catch(done.fail));

        it('returns if no files to upload', (done) => {
            data.events[0].files = [{_id: 'test_file_1'}, {_id: 'test_file_2'}];
            store.test(done, eventsApi.uploadFiles(data.events[0]))
                .then((files) => {
                    expect(files).toEqual([]);
                    expect(services.upload.start.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
        });

        it('only uploads new files', (done) => {
            data.events[0].files = [['test_file_1'], {_id: 'test_file_2'}];
            store.test(done, eventsApi.uploadFiles(data.events[0]))
                .then((files) => {
                    expect(services.upload.start.callCount).toBe(1);
                    expect(services.upload.start.args[0]).toEqual([{
                        method: 'POST',
                        url: 'http://server.com/events_files/',
                        headers: {'Content-Type': 'multipart/form-data'},
                        data: {media: [data.events[0].files[0]]},
                        arrayKey: '',
                    }]);

                    expect(files).toEqual([{_id: 'test_file_1'}]);
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

        xit('duplicate calls `events_duplicate` endpoint', (done) => {
            apiSave = sinon.spy((args) => Promise.resolve(data.events[0]));
            store.test(done, eventsApi.duplicate(data.events[0]))
                .then((item) => {
                    expect(item).toEqual(data.events[0]);

                    expect(services.api.callCount).toBe(1);
                    expect(services.api.args[0]).toEqual(['events_duplicate', data.events[0]]);

                    expect(apiSave.callCount).toBe(1);
                    expect(apiSave.args[0]).toEqual([{}]);

                    done();
                });
        });

        xit('duplicate returns Promise.reject on error', (done) => {
            apiSave = sinon.spy((args) => Promise.reject(errorMessage));
            store.test(done, eventsApi.duplicate(data.events[0]))
                .then(null, (error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });
        });
    });

    it('updateRepetitions', (done) => (
        store.test(done, eventsApi.updateRepetitions(data.events[0], {dates: {}}))
            .then(() => {
                expect(services.api.update.callCount).toBe(1);
                expect(services.api.update.args[0]).toEqual([
                    'events_update_repetitions',
                    data.events[0],
                    {dates: {}},
                ]);

                done();
            })
    ).catch(done.fail));

    describe('save', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'fetchById').callsFake(() => Promise.resolve(data.events[0]));
            sinon.stub(planningApis.events, 'create').returns(Promise.resolve({}));
            sinon.stub(planningApis.events, 'update').returns(Promise.resolve({}));
        });

        afterEach(() => {
            restoreSinonStub(eventsApi.fetchById);
            restoreSinonStub(planningApis.events.create);
            restoreSinonStub(planningApis.events.update);
        });

        it('doesnt call event.api.fetchById if it is a new Event', (done) => (
            store.test(done, eventsApi.save(null, {name: 'New Event', slugline: 'New Slugline'}))
                .then(() => {
                    expect(eventsApi.fetchById.callCount).toBe(0);
                    expect(planningApis.events.update.callCount).toBe(0);
                    expect(planningApis.events.create.callCount).toBe(1);
                    expect(planningApis.events.create.args[0]).toEqual([{
                        name: 'New Event',
                        slugline: 'New Slugline',
                        update_method: 'single',
                    }]);

                    done();
                })
        ).catch(done.fail));
    });

    describe('events.api.fetchCalendars', () => {
        it('fetchCalendars sends RECEIVE_CALENDARS dispatch', (done) => (
            store.test(done, eventsApi.fetchCalendars())
                .then((calendars) => {
                    expect(calendars).toEqual([
                        {
                            name: 'Sport',
                            qcode: 'sport',
                            is_active: true,
                        },
                        {
                            name: 'Finance',
                            qcode: 'finance',
                            is_active: false,
                        },
                        {
                            name: 'Entertainment',
                            qcode: 'entertainment',
                            is_active: true,
                        },
                    ]);

                    expect(store.dispatch.callCount).toBe(1);
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'RECEIVE_CALENDARS',
                        payload: [
                            {
                                name: 'Sport',
                                qcode: 'sport',
                                is_active: true,
                            },
                            {
                                name: 'Finance',
                                qcode: 'finance',
                                is_active: false,
                            },
                            {
                                name: 'Entertainment',
                                qcode: 'entertainment',
                                is_active: true,
                            },
                        ],
                    }]);

                    done();
                })
        ).catch(done.fail));

        it('fetchCalendars returns Promise.reject if an error occurs', (done) => {
            services.vocabularies.getVocabularies = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, eventsApi.fetchCalendars())
                .then(null, (error) => {
                    expect(error).toBe(errorMessage);
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
                    ...data.events[0],
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

            expect(getLocks().event).toEqual({});

            mockStore.dispatch(eventsApi.lock(data.events[0]))
                .then(() => {
                    expect(mocks.api.callCount).toBe(1);
                    expect(mocks.api.args[0]).toEqual([
                        'events_lock',
                        data.events[0],
                    ]);

                    expect(mocks.save.callCount).toBe(1);
                    expect(mocks.save.args[0]).toEqual([
                        {},
                        {lock_action: 'edit'},
                    ]);

                    expect(getLocks().event).toEqual({
                        e1: jasmine.objectContaining({
                            action: 'edit',
                            item_type: 'event',
                            item_id: 'e1',
                        }),
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('calls unlock endpoint and updates the redux store', (done) => {
            store.initialState.locks.event = {
                e1: {
                    action: 'edit',
                    item_type: 'event',
                    item_id: 'e1',
                },
            };

            mockStore = createTestStore({
                initialState: store.initialState,
                extraArguments: {
                    api: mocks.api,
                },
            });

            expect(getLocks().event).toEqual({
                e1: jasmine.objectContaining({
                    action: 'edit',
                    item_type: 'event',
                    item_id: 'e1',
                }),
            });

            mockStore.dispatch(eventsApi.unlock(data.events[0]))
                .then(() => {
                    expect(mocks.api.callCount).toBe(1);
                    expect(mocks.api.args[0]).toEqual([
                        'events_unlock',
                        data.events[0],
                    ]);

                    expect(mocks.save.callCount).toBe(1);
                    expect(mocks.save.args[0]).toEqual([{}]);

                    expect(getLocks().event).toEqual({});

                    done();
                })
                .catch(done.fail);
        });
    });
});
