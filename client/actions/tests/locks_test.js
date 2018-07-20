import sinon from 'sinon';

import {WORKSPACE} from '../../constants';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';

import locks from '../locks';
import assignmentsApi from '../assignments/api';

import eventsApi from '../events/api';
import planningApi from '../planning/api';

describe('actions.locks', () => {
    let store;
    let data;
    let services;

    beforeEach(() => {
        store = getTestActionStore();
        data = store.data;
        services = store.services;

        sinon.stub(assignmentsApi, 'queryLockedAssignments').callsFake(
            () => (Promise.resolve(['as'])));

        sinon.stub(eventsApi, 'lock').callsFake((item) => Promise.resolve(item));
        sinon.stub(planningApi, 'lock').callsFake((item) => Promise.resolve(item));
    });

    afterEach(() => {
        restoreSinonStub(assignmentsApi.queryLockedAssignments);
        restoreSinonStub(eventsApi.lock);
        restoreSinonStub(planningApi.lock);
    });

    describe('loadAssignmentLocks', () => {
        it('queries locked assignments and dispatches RECEIVE_LOCKS', (done) => {
            store.test(done, locks.loadAssignmentLocks())
                .then(() => {
                    expect(assignmentsApi.queryLockedAssignments.callCount).toBe(1);
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'RECEIVE_LOCKS',
                        payload: {assignments: ['as']},
                    }]);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('lock', () => {
        it('determines the item type and calls the appropriate lock action', (done) => (
            store.test(done, locks.lock(data.events[0]))
                .then(() => {
                    expect(eventsApi.lock.callCount).toBe(1);
                    expect(eventsApi.lock.args[0]).toEqual([data.events[0], 'edit']);

                    return store.test(done, locks.lock(data.plannings[0]));
                })
                .then(() => {
                    expect(planningApi.lock.callCount).toBe(1);
                    expect(planningApi.lock.args[0]).toEqual([data.plannings[0], 'edit']);

                    done();
                })
        ).catch(done.fail));

        it('Uses add_to_planning if in AUTHORING workspace', (done) => {
            store.initialState.workspace.currentWorkspace = WORKSPACE.AUTHORING;
            return store.test(done, locks.lock(data.plannings[0]))
                .then(() => {
                    expect(planningApi.lock.callCount).toBe(1);
                    expect(planningApi.lock.args[0]).toEqual([data.plannings[0], 'add_to_planning']);

                    done();
                })
                .catch(done.fail);
        });

        it('Returns Promise.reject if could not determine item type', (done) => (
            store.test(done, locks.lock({test: 'something'}))
                .then(null, (error) => {
                    expect(error).toBe(
                        'Failed to lock the item, could not determine item type!'
                    );
                    expect(services.notify.error.callCount).toBe(1);
                    expect(services.notify.error.args[0]).toEqual(
                        ['Failed to lock the item, could not determine item type!']
                    );

                    done();
                })
        ).catch(done.fail));
    });
});
