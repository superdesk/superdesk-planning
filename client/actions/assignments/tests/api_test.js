import sinon from 'sinon';
import moment from 'moment';
import {get} from 'lodash';

import assignmentsApi from '../api';
import {
    getTestActionStore,
    restoreSinonStub,
} from '../../../utils/testUtils';
import {ASSIGNMENTS, ALL_DESKS} from '../../../constants';

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

    describe('constructQuery', () => {
        it('filter by desk', () => {
            expect(assignmentsApi.constructQuery({deskId: 'desk1'})).toEqual({
                bool: {must: [{term: {'assigned_to.desk': 'desk1'}}]},
            });
        });

        it('doesnt filter any desk if deskId is ALL_DESKS', () => {
            expect(assignmentsApi.constructQuery({deskId: ALL_DESKS})).toEqual({
                bool: {must: []},
            });
        });

        it('filter by user', () => {
            expect(assignmentsApi.constructQuery({userId: 'ident1'})).toEqual({
                bool: {must: [{term: {'assigned_to.user': 'ident1'}}]},
            });
        });

        it('filter by states', () => {
            expect(assignmentsApi.constructQuery({states: ['assigned', 'submitted']})).toEqual({
                bool: {must: [{terms: {'assigned_to.state': ['assigned', 'submitted']}}]},
            });
        });

        it('filter by type', () => {
            expect(assignmentsApi.constructQuery({type: 'text'})).toEqual({
                bool: {must: [{term: {'planning.g2_content_type': 'text'}}]},
            });
        });

        it('filter by priority', () => {
            expect(assignmentsApi.constructQuery({priority: 3})).toEqual({
                bool: {must: [{term: {priority: 3}}]},
            });
        });

        it('filter by text search', () => {
            expect(assignmentsApi.constructQuery({searchQuery: 'planning.slugline.phrase:("Olympics")'})).toEqual({
                bool: {must: [{query_string: {query: 'planning.slugline.phrase:("Olympics")'}}]},
            });
        });

        it('filter by date filter', () => {
            const systemTimezone = get(
                store,
                'initialState.config.defaultTimezone',
                'Australia/Sydney'
            );

            const timezoneOffset = moment()
                .tz(systemTimezone)
                .format('Z');

            // The offset will either be '+10:00' or '+11:00' depending on daylight savings
            expect(['+10:00', '+11:00']).toContain(timezoneOffset);

            expect(assignmentsApi.constructQuery({dateFilter: 'today', systemTimezone: systemTimezone})).toEqual({
                bool: {
                    must: [{
                        range: {
                            'planning.scheduled': {
                                gte: 'now/d',
                                lte: 'now/d',
                                time_zone: timezoneOffset,
                            },
                        },
                    }],
                },
            });

            expect(assignmentsApi.constructQuery({dateFilter: 'current', systemTimezone: 'Australia/Sydney'})).toEqual({
                bool: {
                    must: [{
                        range: {
                            'planning.scheduled': {
                                lte: 'now/d',
                                time_zone: timezoneOffset,
                            },
                        },
                    }],
                },
            });

            expect(assignmentsApi.constructQuery({dateFilter: 'future', systemTimezone: 'Australia/Sydney'})).toEqual({
                bool: {
                    must: [{
                        range: {
                            'planning.scheduled': {
                                gt: 'now/d',
                                time_zone: timezoneOffset,
                            },
                        },
                    }],
                },
            });
        });
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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });

        it('appends baseQuery to constructed query', (done) => {
            const source = JSON.stringify({
                query: {
                    bool: {
                        must: [
                            {term: {priority: 2}},
                            {term: {'assigned_to.state': 'assigned'}},
                            {
                                query_string: {
                                    query: 'planning.slugling.phrase(\'slugline\')',
                                    lenient: false,
                                },
                            },
                        ],
                    },
                },
            });

            store.initialState.assignment.baseQuery = {
                must: [
                    {term: {'assigned_to.state': 'assigned'}},
                    {
                        query_string: {
                            query: 'planning.slugling.phrase(\'slugline\')',
                            lenient: false,
                        },
                    },
                ],
            };


            let params = {
                searchQuery: null,
                priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                orderByField: 'Priority',
                orderDirection: 'Asc',
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 1,
                        sort: '[("priority", 1)]',
                        source: source,
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('query setting the size', (done) => {
            const source = '{"query":{"bool":{"must":[{"terms":{'
                + '"assigned_to.state":["assigned"]}}]}},"size":0}';

            const params = {
                searchQuery: null,
                states: ['assigned'],
                orderByField: 'Updated',
                orderDirection: 'Desc',
                size: 0,
            };

            store.test(done, assignmentsApi.query(params))
                .then(() => {
                    expect(services.api('assignments').query.callCount).toBe(1);
                    const params = services.api('assignments').query.args[0][0];

                    expect(params).toEqual({
                        page: 1,
                        sort: '[("_updated", -1)]',
                        source: source,
                    });

                    done();
                })
                .catch(done.fail);
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
        ).catch(done.fail));
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
                })
                .catch(done.fail);
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
                    expect(assignmentsApi.receivedAssignments.callCount).toBe(0);

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
                .then(() => { /* no-op */ }, (error) => {
                    expect(services.api('assignments').getById.callCount).toBe(1);
                    expect(services.api('assignments').getById.args[0]).toEqual(['as1']);

                    expect(assignmentsApi.receivedAssignments.callCount).toBe(0);

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
                })
                .catch(done.fail);
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
                })
                .catch(done.fail);
        });

        it('calls unlock endpoint', (done) => {
            store.test(done, assignmentsApi.unlock(store.initialState.assignment.assignments['1']))
                .then(() => {
                    expect(services.api('assignments_unlock').save.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });
    });

    it('removeAssignment', (done) => (
        store.test(done, assignmentsApi.removeAssignment(data.assignments[0]))
            .then(() => {
                expect(services.api('assignments').remove.callCount).toBe(1);
                expect(services.api('assignments').remove.args[0]).toEqual([data.assignments[0]]);

                done();
            })
    ).catch(done.fail));
});
