import locks from '../locks';
import assignmentsApi from '../assignments/api';
import sinon from 'sinon';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';

describe('actions.locks', () => {
    let store;

    beforeEach(() => {
        store = getTestActionStore();

        sinon.stub(assignmentsApi, 'queryLockedAssignments').callsFake(
            () => (Promise.resolve(['as'])));
    });

    afterEach(() => {
        restoreSinonStub(assignmentsApi.queryLockedAssignments);
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
                });
        });
    });
});
