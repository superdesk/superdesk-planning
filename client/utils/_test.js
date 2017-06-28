import * as utils from './index'
import sinon from 'sinon'

describe('Utils', function() {
    it('create a store', function() {
        const store = utils.createStore()
        expect(Object.keys(store.getState())).toContain('planning')
    })

    it('create a test store', function() {
        const store = utils.createTestStore()
        expect(Object.keys(store.getState())).toContain('planning')
    })

    it('getErrorMessage returns proper error messages', () => {
        let response = { data: { _message: 'Something happened' } }

        let error = utils.getErrorMessage(response, 'Nothing')
        expect(error).toBe('Something happened')

        response = { data: { _issues: { 'validator exception': 'Something else happened' } } }

        error = utils.getErrorMessage(response, 'Nothing here')
        expect(error).toBe('Something else happened')

        response = { data: {} }
        error = utils.getErrorMessage(response, 'Something unexpected')
        expect(error).toBe('Something unexpected')
    })

    describe('retryDispatch', () => {
        const dispatch = sinon.spy((action) =>  {
            if (typeof action === 'function') {
                return action(dispatch)
            }
        })
        let mockActionDispatcher
        let mockAction
        let mockCheck
        let maxRetries
        let expectedRetries
        const dispatchesPerRetry = 4

        // Store the window.setTimeout so we can restore it after our tests
        let originalSetTimeout = window.setTimeout

        beforeEach(() => {
            // Mock window.setTimeout
            jasmine.getGlobal().setTimeout = func => func()

            mockAction = sinon.spy((dispatch) => {
                dispatch({ type: 'MOCK_ACTION' })
                return Promise.resolve({ _items: [1, 2, 3] })
            })

            mockActionDispatcher = () => mockAction
            mockCheck = sinon.spy(() => false)

            dispatch.reset()
            maxRetries = 3
            expectedRetries = (maxRetries * dispatchesPerRetry) + (dispatchesPerRetry - 2)
        })

        afterEach(() => {
            // Restore window.setTimeout
            jasmine.getGlobal().setTimeout = originalSetTimeout
        })

        it('sends dispatch on every retry', (done) => (
            dispatch(utils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
            .then(() => {
                expect(1).toBe(0, 'Should never get executed')
                done()
            }, () => {
                expect(dispatch.callCount).toBe(expectedRetries)

                // Check each RETRY_DISPATCH action
                // This is the first dispatch of every retryDispatch iteration
                for (let i = 1; i < expectedRetries; i += dispatchesPerRetry) {
                    expect(dispatch.args[i]).toEqual([{
                        type: 'RETRY_DISPATCH',
                        payload: {
                            maxRetries,
                            retries: Math.floor(i / dispatchesPerRetry),
                            interval: 1000,
                        },
                    }])
                }

                done()
            })
        ))

        it('rejects when maxRetries is exceeded', (done) => (
            dispatch(utils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
            .then(() => {
                expect(1).toBe(0, 'Should never get executed')
                done()
            }, (error) => {
                expect(error).toEqual({ error_msg: 'Max retries exceeded' })
                expect(mockAction.callCount).toBe(maxRetries)
                expect(mockCheck.callCount).toBe(maxRetries)
                done()
            })
        ))

        it('fails on first action error', (done) => {
            mockAction = sinon.spy(() => Promise.reject({ error_msg: 'Action failed!' }))
            mockCheck = sinon.spy(() => true)
            return dispatch(utils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
            .then(() => {
                expect(1).toBe(0, 'Should never get executed')
                done()
            }, (error) => {
                expect(dispatch.callCount).toBe(3)
                expect(error).toEqual({ error_msg: 'Action failed!' })
                expect(mockAction.callCount).toBe(1)
                expect(mockCheck.callCount).toBe(0)
                done()
            })
        })

        it('returns the action response on success', (done) => {
            mockCheck = sinon.spy(() => true)
            return dispatch(utils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
            .then((data) => {
                expect(data).toEqual({ _items: [1, 2, 3] })
                expect(mockCheck.callCount).toBe(1)
                done()
            }, () => {
                expect(1).toBe(0, 'Should never get executed')
                done()
            })
        })

        it('executes provided check function on data', (done) => {
            let tries = 0
            mockCheck = sinon.spy((data) => {
                expect(data).toEqual({ _items: [1, 2, 3] })
                tries += 1
                return tries === 2
            })

            return dispatch(utils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
            .then(() => {
                expect(mockCheck.callCount).toBe(2)
                expect(mockCheck.args[0]).toEqual([{ _items: [1, 2, 3] }])
                expect(tries).toBe(2)
                done()
            }, () => {
                expect(1).toBe(0, 'Should never get executed')
                done()
            })
        })
    })
})
