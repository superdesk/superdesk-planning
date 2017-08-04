import sinon from 'sinon'
import * as actions from '../assignment'

describe('assignment', () => {
    describe('actions', () => {
        let assignments
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const desks = { getCurrentDeskId: sinon.spy(() => 'desk1') }
        let apiSpy
        const api = () => (apiSpy)
        const initialState = {
            session: {
                identity: { _id: 'user123' },
                sessionId: 'session123',
            },
        }
        const getState = () => (initialState)

        beforeEach(() => {
            dispatch.reset()
            apiSpy = { query: sinon.spy(() => (Promise.resolve({ _items: assignments }))) }
        })

        it('query with search filter by desk Asc by Created', (done) => {
            const source = '{"query":{"bool":'
                + '{"must":[{"term":{"planning.assigned_to.desk":"desk1"}},'
                + '{"query_string":{"query":"test"}}]}}}'

            initialState.assignment = {
                filterBy: 'All',
                searchQuery: 'test',
                orderByField: 'Created',
                orderDirection: 'Asc',
                lastAssignmentLoadedPage: 2,
            }

            const action = actions.query()

            return action(dispatch, getState, {
                api,
                desks,
            })
            .then((data) => {
                expect(data._items).toEqual(assignments)
                expect(apiSpy.query.callCount).toBe(1)
                expect(apiSpy.query.args[0]).toEqual([{
                    page: 2,
                    sort: '[("_created", 1)]',
                    source: source,
                }])

                done()
            })
            .catch((error) => {
                expect(error).toBe(null)
                expect(error.stack).toBe(null)
                done()
            })
        })

        it('query without search and filter by user Desc by Updated', (done) => {
            const source = '{"query":{"bool":{"must":[{"term":'
                + '{"planning.assigned_to.user":"user123"}}]}}}'

            initialState.assignment = {
                filterBy: 'User',
                searchQuery: null,
                orderByField: 'Updated',
                orderDirection: 'Desc',
                lastAssignmentLoadedPage: 3,
            }

            const action = actions.query()

            return action(dispatch, getState, {
                api,
                desks,
            })
            .then((data) => {
                expect(data._items).toEqual(assignments)
                expect(apiSpy.query.callCount).toBe(1)
                expect(apiSpy.query.args[0]).toEqual([{
                    page: 3,
                    sort: '[("_updated", -1)]',
                    source: source,
                }])

                done()
            })
            .catch((error) => {
                expect(error).toBe(null)
                expect(error.stack).toBe(null)
                done()
            })
        })
    })
})
