import sinon from 'sinon';
import {omit} from 'lodash';
import moment from 'moment';
import {autosave} from '../';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';
import {eventUtils, modifyForClient, modifyForServer} from '../../utils';

describe('actions.autosave', () => {
    let store;
    let services;
    let data;
    const errorMessage = {data: {_message: 'Failed!'}};

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        data.event_autosave = [eventUtils.modifyForClient({
            ...data.events[0],
            slugline: 'New Event Slugline',
            lock_action: 'edit',
            lock_user: store.initialState.session.identity._id,
            lock_session: store.initialState.session.sessionId,
        })];

        delete data.event_autosave[0].planning_ids;

        data.planning_autosave = [{
            ...data.plannings[0],
            slugline: 'New Planning Slugline',
            lock_action: 'edit',
            lock_user: store.initialState.session.identity._id,
            lock_session: store.initialState.session.sessionId,
        }];
    });

    afterEach(() => {
        restoreSinonStub(autosave.fetch);
    });

    describe('fetch autosave items', () => {
        it('fetches items and saves them to redux', (done) => (
            store.test(done, autosave.fetch('event'))
                .then(() => {
                    expect(services.api('event_autosave').query.callCount).toBe(1);
                    expect(services.api('event_autosave').query.args[0]).toEqual([{
                        where: JSON.stringify({
                            lock_user: store.initialState.session.identity._id,
                        }),
                    }]);

                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'AUTOSAVE_RECEIVE_ALL',
                        payload: {
                            itemType: 'event',
                            autosaves: data.event_autosave,
                        },
                    }]);

                    done();
                }, done.fail)
        ));

        it('notifies user if failed to load autosave items', (done) => {
            services.api('event_autosave').query = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, autosave.fetch('event'))
                .then(done.fail, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });

        it('fetch via helper actions', (done) => {
            sinon.stub(autosave, 'fetch').callsFake(() => Promise.resolve());

            autosave.fetchEvents();
            expect(autosave.fetch.callCount).toBe(1);
            expect(autosave.fetch.args[0]).toEqual(['event']);

            autosave.fetchPlanning();
            expect(autosave.fetch.callCount).toBe(2);
            expect(autosave.fetch.args[1]).toEqual(['planning']);

            store.test(done, autosave.fetchAll())
                .then(() => {
                    expect(autosave.fetch.callCount).toBe(4);
                    expect(autosave.fetch.args[2]).toEqual(['event']);
                    expect(autosave.fetch.args[3]).toEqual(['planning']);

                    done();
                }, done.fail);
        });

        it('fetchById from the redux store', (done) => (
            store.test(done, autosave.fetchById('event', data.events[0]._id))
                .then((autosaveItem) => {
                    expect(autosaveItem).toEqual(data.event_autosave[0]);

                    done();
                }, done.fail)
        ));

        it('fetchById from the server', (done) => {
            store.init();
            store.initialState.forms.autosaves.event = {};
            store.test(done, autosave.fetchById('event', data.events[0]._id))
                .then((autosaveItem) => {
                    expect(autosaveItem).toEqual(
                        eventUtils.modifyForClient(data.event_autosave[0])
                    );

                    expect(services.api('event_autosave').getById.callCount).toBe(1);
                    expect(services.api('event_autosave').getById.args[0]).toEqual([data.events[0]._id]);

                    done();
                }, done.fail);
        });
    });

    describe('save', () => {
        it('creates a new autosave item', (done) => (
            store.test(done, autosave.save(null, {
                ...data.events[1],
                _id: 'tempId-e4',
            }))
                .then((updatedItem) => {
                    const expectedItem = {
                        ...data.events[1],
                        _id: 'tempId-e4',
                        duplicate_from: 'e1',
                        lock_action: 'create',
                        lock_user: store.initialState.session.identity._id,
                        lock_session: store.initialState.session.sessionId,
                    };

                    delete expectedItem.planning_ids;

                    expect(updatedItem).toEqual(jasmine.objectContaining(
                        modifyForClient(expectedItem)
                    ));

                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'AUTOSAVE_RECEIVE',
                        payload: jasmine.objectContaining(
                            modifyForClient(expectedItem)
                        ),
                    }]);

                    expect(services.api('event_autosave').save.callCount).toBe(1);
                    expect(services.api('event_autosave').save.args[0]).toEqual([
                        {},
                        jasmine.objectContaining(modifyForServer(expectedItem)),
                    ]);

                    done();
                }, done.fail)
        ));

        it('updates an existing autosave item', (done) => (
            store.test(done, autosave.save(data.event_autosave[0], {
                ...data.event_autosave[0],
                slugline: 'Newest Event Slugline',
                name: 'Test Name',
                dates: {
                    ...data.event_autosave[0].dates,
                    tz: moment.tz.guess(),
                },
            }))
                .then((updatedItem) => {
                    let expectedItem = {
                        ...data.event_autosave[0],
                        slugline: 'Newest Event Slugline',
                        name: 'Test Name',
                        lock_action: 'edit',
                        lock_user: store.initialState.session.identity._id,
                        lock_session: store.initialState.session.sessionId,
                        dates: {
                            ...data.event_autosave[0].dates,
                            tz: moment.tz.guess(),
                        },
                    };

                    delete expectedItem._etag;

                    const autosaveItem = jasmine.objectContaining(expectedItem);

                    expect(updatedItem).toEqual(autosaveItem);

                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'AUTOSAVE_RECEIVE',
                        payload: autosaveItem,
                    }]);

                    expect(services.api('event_autosave').save.callCount).toBe(1);
                    expect(services.api('event_autosave').save.args[0]).toEqual([
                        data.event_autosave[0],
                        jasmine.objectContaining(omit(expectedItem, ['_startTime', '_endTime'])),
                    ]);

                    done();
                }, done.fail)
        ));

        it('notifies the user if saving fails', (done) => {
            services.api('event_autosave').save = sinon.spy(() => Promise.reject(errorMessage));
            store.test(done, autosave.save(data.event_autosave[0], data.event_autosave[0]))
                .then(done.fail, (error) => {
                    expect(error).toEqual(errorMessage);

                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(['Failed!']);

                    done();
                });
        });
    });

    describe('remove', () => {
        it('removes an item from the local Redux store and the server', (done) => (
            store.test(done, autosave.remove(data.event_autosave[0]))
                .then(() => {
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'AUTOSAVE_REMOVE',
                        payload: data.event_autosave[0],
                    }]);

                    expect(services.api('event_autosave').remove.callCount).toBe(1);
                    expect(services.api('event_autosave').remove.args[0]).toEqual(
                        [data.event_autosave[0]]
                    );

                    done();
                }, done.fail)
        ));

        it('only removes autosave from Redux if item doesnt have an etag', (done) => {
            delete data.event_autosave[0]._etag;
            store.test(done, autosave.remove(data.event_autosave[0]))
                .then(() => {
                    expect(store.dispatch.args[0]).toEqual([{
                        type: 'AUTOSAVE_REMOVE',
                        payload: data.event_autosave[0],
                    }]);

                    expect(services.api('event_autosave').remove.callCount).toBe(0);

                    done();
                }, done.fail);
        });

        it('removes an item by itemType and itemId', (done) => (
            store.test(done, autosave.removeById('event', data.events[0]._id))
                .then(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'AUTOSAVE_REMOVE',
                        payload: data.event_autosave[0],
                    }]);

                    expect(services.api('event_autosave').remove.callCount).toBe(1);
                    expect(services.api('event_autosave').remove.args[0]).toEqual(
                        [data.event_autosave[0]]
                    );

                    done();
                }, done.fail)
        ));

        describe('auto save not found', () => {
            beforeEach(() => {
                sinon.stub(store.spies.api, '_getById').callsFake(() => Promise.reject({status: 404}));
            });

            afterEach(() => {
                restoreSinonStub(store.spies.api._getById);
            });

            it('removes an item from the store', (done) => (
                store.test(done, autosave.removeById('event', data.events[0]._id))
                    .then(() => {
                        expect(store.dispatch.args[0]).toEqual([{
                            type: 'AUTOSAVE_REMOVE',
                            payload: {_id: data.events[0]._id, type: 'event'},
                        }]);

                        expect(services.api('event_autosave').remove.callCount).toBe(0);

                        done();
                    }, done.fail)
            ));
        });
    });
});
