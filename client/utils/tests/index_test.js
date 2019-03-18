import * as utils from '../index';
import sinon from 'sinon';
import lockReducer from '../../reducers/locks';
import {PRIVILEGES} from '../../constants';

describe('Utils', () => {
    it('create a store', () => {
        const store = utils.createStore();

        expect(Object.keys(store.getState())).toContain('planning');
    });

    it('create a test store', () => {
        const store = utils.createTestStore();

        expect(Object.keys(store.getState())).toContain('planning');
    });

    it('getErrorMessage returns proper error messages', () => {
        let response = {data: {_message: 'Something happened'}};

        let error = utils.getErrorMessage(response, 'Nothing');

        expect(error).toBe('Something happened');

        response = {data: {_issues: {'validator exception': 'Something else happened'}}};

        error = utils.getErrorMessage(response, 'Nothing here');
        expect(error).toBe('Something else happened');

        response = {data: {}};
        error = utils.getErrorMessage(response, 'Something unexpected');
        expect(error).toBe('Something unexpected');
    });

    describe('retryDispatch', () => {
        const dispatch = sinon.spy((action) => {
            if (typeof action === 'function') {
                return action(dispatch);
            }
        });
        let mockActionDispatcher;
        let mockAction;
        let mockCheck;
        let maxRetries;
        let expectedRetries;
        const dispatchesPerRetry = 4;

        // Store the window.setTimeout so we can restore it after our tests
        let originalSetTimeout = window.setTimeout;

        beforeEach(() => {
            // Mock window.setTimeout
            jasmine.getGlobal().setTimeout = (func) => {
                func();
                return 1;
            };

            mockAction = sinon.spy((dispatch) => {
                dispatch({type: 'MOCK_ACTION'});
                return Promise.resolve({_items: [1, 2, 3]});
            });

            mockActionDispatcher = () => mockAction;
            mockCheck = sinon.spy(() => false);

            dispatch.resetHistory();
            maxRetries = 3;
            expectedRetries = (maxRetries * dispatchesPerRetry) + (dispatchesPerRetry - 2);
        });

        afterEach(() => {
            // Restore window.setTimeout
            jasmine.getGlobal().setTimeout = originalSetTimeout;
        });

        it('sends dispatch on every retry', (done) => (
            dispatch(utils.dispatchUtils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
                .then(() => {
                    expect(1).toBe(0, 'Should never get executed');
                    done();
                }, () => {
                    expect(dispatch.callCount).toBe(expectedRetries);

                    // Check each RETRY_DISPATCH action
                    // This is the first dispatch of every retryDispatch iteration
                    for (let i = 1; i < expectedRetries; i += dispatchesPerRetry) {
                        expect(dispatch.args[i]).toEqual([{
                            type: 'RETRY_DISPATCH',
                            payload: {
                                maxRetries: maxRetries,
                                retries: Math.floor(i / dispatchesPerRetry),
                                interval: 1000,
                            },
                        }]);
                    }

                    done();
                })
        ).catch(done.fail));

        it('rejects when maxRetries is exceeded', (done) => (
            dispatch(utils.dispatchUtils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
                .then(() => {
                    expect(1).toBe(0, 'Should never get executed');
                    done();
                }, (error) => {
                    expect(error).toEqual({error_msg: 'Max retries exceeded'});
                    expect(mockAction.callCount).toBe(maxRetries);
                    expect(mockCheck.callCount).toBe(maxRetries);
                    done();
                })
        ).catch(done.fail));

        it('fails on first action error', (done) => {
            mockAction = sinon.spy(() => Promise.reject({error_msg: 'Action failed!'}));
            mockCheck = sinon.spy(() => true);
            return dispatch(utils.dispatchUtils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
                .then(() => {
                    expect(1).toBe(0, 'Should never get executed');
                    done();
                }, (error) => {
                    expect(dispatch.callCount).toBe(3);
                    expect(error).toEqual({error_msg: 'Action failed!'});
                    expect(mockAction.callCount).toBe(1);
                    expect(mockCheck.callCount).toBe(0);
                    done();
                })
                .catch(done.fail);
        });

        it('returns the action response on success', (done) => {
            mockCheck = sinon.spy(() => true);
            return dispatch(utils.dispatchUtils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
                .then((data) => {
                    expect(data).toEqual({_items: [1, 2, 3]});
                    expect(mockCheck.callCount).toBe(1);
                    done();
                }, () => {
                    expect(1).toBe(0, 'Should never get executed');
                    done();
                })
                .catch(done.fail);
        });

        it('executes provided check function on data', (done) => {
            let tries = 0;

            mockCheck = sinon.spy((data) => {
                expect(data).toEqual({_items: [1, 2, 3]});
                tries += 1;
                return tries === 2;
            });

            return dispatch(utils.dispatchUtils.retryDispatch(mockActionDispatcher(), mockCheck, maxRetries))
                .then(() => {
                    expect(mockCheck.callCount).toBe(2);
                    expect(mockCheck.args[0]).toEqual([{_items: [1, 2, 3]}]);
                    expect(tries).toBe(2);
                    done();
                }, () => {
                    expect(1).toBe(0, 'Should never get executed');
                    done();
                })
                .catch(done.fail);
        });

        it('if not scheduled dispatch is called', (done) => {
            let nextDispatch = {
                called: false,
            };

            return dispatch(utils.dispatchUtils.scheduleDispatch(mockActionDispatcher(), nextDispatch))
                .then(() => {
                    expect(mockAction.callCount).toBe(1);
                    // nextDispatch.called value is modified
                    expect(nextDispatch.called).toBe(0);
                    done();
                }, () => {
                    expect(1).toBe(0, 'Should never get executed');
                    done();
                })
                .catch(done.fail);
        });

        it('if scheduled dispatch is not called', (done) => {
            let nextDispatch = {
                called: true,
            };

            return dispatch(utils.dispatchUtils.scheduleDispatch(mockActionDispatcher(), nextDispatch))
                .then(() => {
                    expect(mockAction.callCount).toBe(0);
                    // nextDispatch.called value is not modified
                    expect(nextDispatch.called).toBe(true);
                    done();
                }, () => {
                    expect(1).toBe(0, 'Should never get executed');
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('gettext', () => {
        it('can return string', () => {
            expect(utils.gettext('foo')).toBe('foo');
        });
    });

    describe('isItemReadOnly', () => {
        let session, locks, lockedItems, privilages, item;

        beforeEach(() => {
            session = {
                identity: {_id: 'ident1'},
                sessionId: 'session1',
            };

            locks = {
                events: {
                    standalone: {
                        _id: 'e9',
                        lock_user: 'ident1',
                        lock_session: 'session1',
                        lock_action: 'edit',
                        lock_time: '2099-10-15T14:30+0000',
                    },
                },
            };

            // Use the Lock Reducer to construct the list of locks
            lockedItems = lockReducer({}, {
                type: 'RECEIVE_LOCKS',
                payload: {events: [locks.events.standalone]},
            });

            privilages = {[PRIVILEGES.EVENT_MANAGEMENT]: 1};

            item = {
                _id: 'e9',
                state: 'cancelled',
                lock_user: 'ident1',
                lock_session: 'session1',
                lock_action: 'edit',
                lock_time: '2099-10-15T14:30+0000',
            };
        });


        it('cancelled item is readOnly even if it has edit lock', () => {
            expect(utils.isItemReadOnly(item, session, privilages, lockedItems)).toBe(true);
        });
    });
});
