import sinon from 'sinon';
import moment from 'moment';

import assignmentsApi from '../api';
import contactsApi from '../../contacts';
import {
    getTestActionStore,
    restoreSinonStub,
} from '../../../utils/testUtils';
import {ASSIGNMENTS} from '../../../constants';
import {noop} from 'lodash';
import {fakePromise} from './test-utils';

describe('actions.assignments.api', () => {
    let store: ReturnType<typeof getTestActionStore>;
    let services;
    let data;
    let receivedAssignmentsStub;

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        receivedAssignmentsStub = sinon.stub(assignmentsApi, 'receivedAssignments').callsFake(fakePromise);
        sinon.stub(assignmentsApi, 'query').callsFake(fakePromise);
        sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(fakePromise);
        sinon.stub(assignmentsApi, 'save').callsFake(fakePromise);
    });

    afterEach(() => {
        restoreSinonStub(assignmentsApi.query);
        restoreSinonStub(assignmentsApi.receivedAssignments);
        restoreSinonStub(assignmentsApi.fetchAssignmentById);
        restoreSinonStub(assignmentsApi.save);
    });

    describe('fetchByAssignmentId', () => {
        beforeEach(() => {
            restoreSinonStub(assignmentsApi.fetchAssignmentById);
        });

        it('fetches using assignment id', (done) => {
            store.test(done, () => {
                store.initialState.assignment.assignments = {};
                return store.dispatch(assignmentsApi.fetchAssignmentById('as1'));
            })
                .then((item) => {
                    expect(item).toEqual(data.assignments[0]);
                    expect(services.api('assignments').getById.callCount).toBe(1);
                    expect(receivedAssignmentsStub.callCount).toBe(1);
                    expect(receivedAssignmentsStub.args[0]).toEqual([[data.assignments[0]]]);
                    expect(receivedAssignmentsStub.args[0]).toEqual([[data.assignments[0]]]);
                    done();
                })
                .catch(done.fail);
        });

        it('fetch assignment using force=true', (done) => {
            store.test(done, () => store.dispatch(assignmentsApi.fetchAssignmentById('as1', true)))
                .then((item) => {
                    expect(item).toEqual(data.assignments[0]);
                    expect(services.api('assignments').getById.callCount).toBe(1);
                    expect(services.api('assignments').getById.args[0]).toEqual(['as1']);

                    expect(receivedAssignmentsStub.callCount).toBe(1);
                    expect(receivedAssignmentsStub.args[0]).toEqual([[data.assignments[0]]]);
                    done();
                })
                .catch(done.fail);
        });

        it('returns store instance when already loaded', (done) => {
            store.test(done, () => store.dispatch(assignmentsApi.fetchAssignmentById('as1')))
                .then((item) => {
                    const storeItem = {
                        ...data.assignments[0],
                        planning: {
                            ...data.assignments[0].planning,
                            scheduled: moment(data.assignments[0].planning.scheduled),
                        },
                    };

                    expect(item).toEqual(storeItem);
                    expect(services.api('assignments').getById.callCount).toBe(0);
                    expect(receivedAssignmentsStub.callCount).toBe(0);

                    done();
                })
                .catch(done.fail);
        });

        it('returns Promise.reject on error', (done) => {
            services.api('assignments').getById = sinon.spy(() => (Promise.reject('Failed!')));
            store.test(done, () => {
                store.initialState.assignment.assignments = {};
                return store.dispatch(assignmentsApi.fetchAssignmentById('as1'));
            })
                .then(noop, (error) => {
                    expect(services.api('assignments').getById.callCount).toBe(1);
                    expect(services.api('assignments').getById.args[0]).toEqual(['as1']);

                    expect(receivedAssignmentsStub.callCount).toBe(0);

                    expect(error).toBe('Failed!');
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('link', () => {
        it('links based on provided coverage', (done) => {
            data.plannings[0].coverages.pop();
            store.test(done, assignmentsApi.link(
                data.plannings[0].coverages[0].assigned_to,
                {_id: 'item1'}, true))
                .then(() => {
                    expect(services.api('assignments_link').save.callCount).toBe(1);
                    expect(services.api('assignments_link').save.args[0]).toEqual([
                        {},
                        {
                            assignment_id: 'as1',
                            item_id: 'item1',
                            reassign: true,
                        },
                    ]);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('receivedAssignments', () => {
        beforeEach(() => {
            restoreSinonStub(assignmentsApi.receivedAssignments);
            sinon.stub(contactsApi, 'fetchContactsFromAssignments').returns(() => Promise.resolve([]));
        });

        afterEach(() => {
            restoreSinonStub(contactsApi.fetchContactsFromAssignments);
        });

        it('adds the assignments to the store', () => {
            store.dispatch(assignmentsApi.receivedAssignments(data.assignments));

            expect(store.dispatch.callCount).toBe(4);
            expect(store.dispatch.args[3][0]).toEqual({
                type: ASSIGNMENTS.ACTIONS.RECEIVED_ASSIGNMENTS,
                payload: data.assignments,
            });
        });

        it('loads contacts from received assignment items', () => {
            const items = [
                {assigned_to: {contact: 'con1'}},
                {assigned_to: {contact: 'con2'}},
                {assigned_to: {user: 'ident1'}},
                {assigned_to: {}},
            ];

            store.dispatch(assignmentsApi.receivedAssignments(items));
            const stub = (contactsApi.fetchContactsFromAssignments as sinon.SinonStub);

            expect(stub.callCount).toBe(1);
            expect(stub.args[0]).toEqual([items]);
        });
    });
});
