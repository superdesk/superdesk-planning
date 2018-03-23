import assignmentsApi from '../api';
import sinon from 'sinon';
import moment from 'moment';
import {
    getTestActionStore,
    restoreSinonStub,
} from '../../../utils/testUtils';
import {ASSIGNMENTS} from '../../../constants';

describe('actions.assignments.api', () => {
    let store;
    let services;
    let data;

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;

        sinon.stub(assignmentsApi, 'query').callsFake(() => (Promise.resolve({})));
        sinon.stub(assignmentsApi, 'receivedAssignments').callsFake(() => (Promise.resolve({})));
        sinon.stub(assignmentsApi, 'fetchAssignmentById').callsFake(() => (Promise.resolve({})));
        sinon.stub(assignmentsApi, 'save').callsFake(() => (Promise.resolve({})));
    });

    afterEach(() => {
        restoreSinonStub(assignmentsApi.query);
        restoreSinonStub(assignmentsApi.receivedAssignments);
        restoreSinonStub(assignmentsApi.fetchAssignmentById);
        restoreSinonStub(assignmentsApi.save);
    });

    describe('query', () => {
        beforeEach(() => {
            restoreSinonStub(assignmentsApi.query);
        });

        it('query with search filter by desk Asc by Created', (done) => {
            const source = '{"query":{"bool":{"must":[{"term":{"assigned_to.desk":"desk1"}},'
                + '{"query_string":{"query":"test"}}]}}}';

            const params = {
                deskId: 'desk1',
                searchQuery: 'test',
                orderByField: 'Created',
                orderDirection: 'Asc',
                page: 2,
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    const params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 2,
                        sort: '[("_created", 1)]',
                        source: source,
                    });

                    done();
                });
        });

        it('query without search and filter by user Desc by Updated', (done) => {
            const source = '{"query":{"bool":{"must":[{"term":{'
                + '"assigned_to.user":"ident1"}}]}}}';

            const params = {
                userId: 'ident1',
                searchQuery: null,
                orderByField: 'Updated',
                orderDirection: 'Desc',
                page: 3,
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    const params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 3,
                        sort: '[("_updated", -1)]',
                        source: source,
                    });

                    done();
                });
        });

        it('query using state', (done) => {
            const source = '{"query":{"bool":{"must":[{"terms":{'
                + '"assigned_to.state":["assigned"]}}]}}}';

            const params = {
                searchQuery: null,
                states: ['assigned'],
                orderByField: 'Updated',
                orderDirection: 'Desc',
                page: 3,
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    const params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 3,
                        sort: '[("_updated", -1)]',
                        source: source,
                    });

                    done();
                });
        });

        it('query using type', (done) => {
            const source = '{"query":{"bool":{"must":[{"term":{'
                + '"planning.g2_content_type":"picture"}}]}}}';

            const params = {
                searchQuery: null,
                type: 'picture',
                orderByField: 'Updated',
                orderDirection: 'Desc',
                page: 3,
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    const params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 3,
                        sort: '[("_updated", -1)]',
                        source: source,
                    });

                    done();
                });
        });

        it('query using priority', (done) => {
            const source = '{"query":{"bool":{"must":[{"term":{"priority":2}}]}}}';

            const params = {
                searchQuery: null,
                priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                orderByField: 'Updated',
                orderDirection: 'Desc',
                page: 3,
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    const params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 3,
                        sort: '[("_updated", -1)]',
                        source: source,
                    });

                    done();
                });
        });

        it('Can sort by priority Desceding', (done) => {
            const source = '{"query":{"bool":{"must":[{"term":{"priority":2}}]}}}';

            const params = {
                searchQuery: null,
                priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                orderByField: 'Priority',
                orderDirection: 'Desc',
                page: 3,
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    const params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 3,
                        sort: '[("priority", -1)]',
                        source: source,
                    });

                    done();
                });
        });

        it('Can sort by priority Ascending', (done) => {
            const source = '{"query":{"bool":{"must":[{"term":{"priority":2}}]}}}';

            const params = {
                searchQuery: null,
                priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                orderByField: 'Priority',
                orderDirection: 'Asc',
                page: 3,
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    const params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 3,
                        sort: '[("priority", 1)]',
                        source: source,
                    });

                    done();
                });
        });
    });

    describe('queryLockedAssignments', () => {
        it('queries for locked assignments', (done) => (
            store.test(done, assignmentsApi.queryLockedAssignments())
                .then(() => {
                    const query = {constant_score: {filter: {exists: {field: 'lock_session'}}}};

                    expect(services.api('assignments').query.callCount).toBe(1);
                    expect(services.api('assignments').query.args[0]).toEqual([
                        {source: JSON.stringify({query})},
                    ]);
                    done();
                })
        ));
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
                    expect(services.api('assignments').getById.args[0]).toEqual(['as1']);

                    expect(assignmentsApi.receivedAssignments.callCount).toBe(1);
                    expect(assignmentsApi.receivedAssignments.args[0]).toEqual([[data.assignments[0]]]);
                    done();
                });
        });

        it('fetch assignment using force=true', (done) => {
            store.test(done, () => store.dispatch(assignmentsApi.fetchAssignmentById('as1', true)))
                .then((item) => {
                    expect(item).toEqual(data.assignments[0]);
                    expect(services.api('assignments').getById.callCount).toBe(1);
                    expect(services.api('assignments').getById.args[0]).toEqual(['as1']);

                    expect(assignmentsApi.receivedAssignments.callCount).toBe(1);
                    expect(assignmentsApi.receivedAssignments.args[0]).toEqual([[data.assignments[0]]]);
                    done();
                });
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
                    expect(assignmentsApi.receivedAssignments.callCount).toBe(0);

                    done();
                });
        });

        it('returns Promise.reject on error', (done) => {
            services.api('assignments').getById = sinon.spy(() => (Promise.reject('Failed!')));
            store.test(done, () => {
                store.initialState.assignment.assignments = {};
                return store.dispatch(assignmentsApi.fetchAssignmentById('as1'));
            })
                .then(() => { /* no-op */ }, (error) => {
                    expect(services.api('assignments').getById.callCount).toBe(1);
                    expect(services.api('assignments').getById.args[0]).toEqual(['as1']);

                    expect(assignmentsApi.receivedAssignments.callCount).toBe(0);

                    expect(error).toBe('Failed!');
                    done();
                });
        });
    });

    describe('link', () => {
        it('links based on provided coverage', (done) => {
            data.plannings[0].coverages.pop();
            store.test(done, assignmentsApi.link(
                data.plannings[0].coverages[0].assigned_to,
                {_id: 'item1'}
            ))
                .then(() => {
                    expect(services.api('assignments_link').save.callCount).toBe(1);
                    expect(services.api('assignments_link').save.args[0]).toEqual([
                        {},
                        {
                            assignment_id: 'as1',
                            item_id: 'item1',
                        },
                    ]);
                    done();
                });
        });
    });

    describe('assignments_lock', () => {
        it('calls lock endpoint if assignment not locked', (done) => {
            store.test(done, assignmentsApi.lock(store.initialState.assignment.assignments['1']))
                .then(() => {
                    expect(services.api('assignments_lock').save.callCount).toBe(1);
                    expect(services.api('assignments_lock').save.args[0]).toEqual([
                        {},
                        {lock_action: 'edit'},
                    ]);
                    done();
                });
        });

        it('does not call lock endpoint if assignment already locked', (done) => {
            store.initialState.assignment.assignments['1'] = {
                ...store.initialState.assignment.assignments['1'],
                lock_user: 'ident1',
                lock_session: 'session1',
            };
            store.test(done, assignmentsApi.lock(store.initialState.assignment.assignments['1']))
                .then((item) => {
                    expect(services.api('assignments_lock').save.callCount).toBe(0);
                    expect(item).toEqual(store.initialState.assignment.assignments[1]);
                    done();
                });
        });

        it('calls unlock endpoint', (done) => {
            store.test(done, assignmentsApi.unlock(store.initialState.assignment.assignments['1']))
                .then(() => {
                    expect(services.api('assignments_unlock').save.callCount).toBe(1);
                    done();
                });
        });
    });

    it('removeAssignment', (done) => (
        store.test(done, assignmentsApi.removeAssignment(data.assignments[0]))
            .then(() => {
                expect(services.api('assignments').remove.callCount).toBe(1);
                expect(services.api('assignments').remove.args[0]).toEqual([data.assignments[0]]);

                done();
            })
    ));
});
