import sinon from 'sinon';
import * as actions from '../../actions';
import {createTestStore, registerNotifications} from '../../utils';
import {cloneDeep} from 'lodash';
import * as selectors from '../../selectors';
import moment from 'moment';
import {restoreSinonStub} from '../../utils/testUtils';

import eventsUi from '../events/ui';

describe('events', () => {
    describe('actions', () => {
        let events = [
            {
                _id: 'e1',
                name: 'Event 1',
                dates: {
                    start: '2016-10-15T13:01:11+0000',
                    end: '2016-10-15T14:01:11+0000',
                },
                lock_user: 'user123',
                lock_session: 'session123',
            },
            {
                _id: 'e2',
                name: 'Event 2',
                dates: {
                    start: '2014-10-15T14:01:11+0000',
                    end: '2014-10-15T15:01:11+0000',
                },
            },
            {
                _id: 'e3',
                name: 'Event 3',
                dates: {
                    start: '2015-10-15T14:01:11+0000',
                    end: '2015-10-15T15:01:11+0000',
                },
            },
        ];
        const initialState = {
            events: {
                events: {
                    e1: events[0],
                    e2: events[1],
                    e3: events[2],
                },
                eventsInList: [],
                show: true,
                showEventDetails: null,
                highlightedEvent: null,
                lastRequestParams: {page: 1},
                eventHistoryItems: [],
            },
            privileges: {
                planning: 1,
                planning_event_management: 1,
                planning_event_spike: 1,
                planning_event_unspike: 1,
            },
            planning: {plannings: {}},
            config: {server: {url: 'http://server.com'}},
            users: [{_id: 'user123'}],
            session: {
                identity: {_id: 'user123'},
                sessionId: 'session123',
            },
            main: {
                filter: 'EVENTS',
                search: {
                    EVENTS: {
                        lastRequestParams: {page: 1},
                        fulltext: undefined,
                        currentSearch: undefined
                    },
                }
            }
        };
        const getState = () => (initialState);
        let dispatch;

        // Special dispatcher for `checkPermission` that executes the first dispatch
        // and mocks the proceeding calls
        const dispatchCheckPermission = sinon.spy((action) => {
            if (typeof action === 'function' && dispatch.callCount < 2) {
                return action(dispatch, getState, {
                    notify,
                    api,
                    $timeout,
                });
            }

            return action;
        });

        const dispatchRunFunction = sinon.spy((action) => {
            if (typeof action === 'function') {
                return action(dispatch, getState, {
                    notify,
                    api,
                    $timeout,
                });
            }

            return action;
        });

        const notify = {
            error: sinon.spy(),
            success: sinon.spy(),
            pop: sinon.spy(),
        };
        const $timeout = sinon.spy((func) => func());

        let apiSpy;
        const api = () => (apiSpy);

        beforeEach(() => {
            apiSpy = {
                query: sinon.spy(() => (Promise.resolve({_items: events}))),
                remove: sinon.spy(() => (Promise.resolve())),
                save: sinon.spy((ori, item) => (Promise.resolve({
                    _id: 'e4',
                    ...ori,
                    ...item,
                }))),
            };

            dispatch = sinon.spy(() => (Promise.resolve()));

            notify.error.reset();
            notify.success.reset();
            dispatchCheckPermission.reset();
            dispatchRunFunction.reset();
            $timeout.reset();

            sinon.stub(eventsUi, 'refetchEvents').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.refetchEvents);
        });

        describe('fetchEventById', () => {
            it('calls api.getById and runs dispatches', (done) => {
                api.find = sinon.spy(() => Promise.resolve(events[1]));
                const action = actions.fetchEventById('e2');

                return action(dispatch, getState, {
                    api,
                    notify,
                })
                    .then((event) => {
                        expect(event).toEqual(events[1]);
                        expect(api.find.callCount).toBe(1);
                        expect(api.find.args[0]).toEqual([
                            'events',
                            'e2',
                            {embedded: {files: 1}}
                        ]);

                        expect(dispatch.callCount).toBe(2);
                        expect(dispatch.args[0]).toEqual([jasmine.objectContaining({
                            type: 'ADD_EVENTS',
                            payload: [events[1]],
                        })]);
                        expect(dispatch.args[1]).toEqual([{
                            type: 'ADD_TO_EVENTS_LIST',
                            payload: ['e2'],
                        }]);

                        expect(notify.error.callCount).toBe(0);
                        done();
                    })
                    .catch((error) => {
                        expect(error).toBe(null);
                        expect(error.stack).toBe(null);
                        done();
                    });
            });

            it('notifies end user if an error occurred', (done) => {
                api.find = sinon.spy(() => Promise.reject());
                const action = actions.fetchEventById('e2');

                return action(dispatch, getState, {
                    api,
                    notify,
                })
                    .then(() => {
                        expect(notify.error.callCount).toBe(1);
                        expect(notify.error.args[0]).toEqual(['Failed to fetch an Event!']);
                        done();
                    })
                    .catch((error) => {
                        expect(error).toBe(null);
                        expect(error.stack).toBe(null);
                        done();
                    });
            });
        });

        it('addToList', () => {
            const ids = ['e4', 'e5', 'e6'];
            const action = actions.events.ui.addToList(ids);

            expect(action).toEqual({
                type: 'ADD_TO_EVENTS_LIST',
                payload: ids,
            });
        });

        it('openAdvancedSearch', () => {
            const action = actions.events.ui.openAdvancedSearch();

            expect(action).toEqual({type: 'EVENT_OPEN_ADVANCED_SEARCH'});
        });

        it('closeAdvancedSearch', () => {
            const action = actions.events.ui.closeAdvancedSearch();

            expect(action).toEqual({type: 'EVENT_CLOSE_ADVANCED_SEARCH'});
        });

        it('toggleEventsList', () => {
            const action = actions.toggleEventsList();

            expect(action).toEqual({type: 'TOGGLE_EVENT_LIST'});
        });
    });

    describe('websocket', () => {
        const initialState = {
            events: {
                events: {
                    e1: {
                        _id: 'e1',
                        name: 'Event1',
                        dates: {
                            start: '2017-05-31T16:37:11+0000',
                            end: '2017-05-31T17:37:11+0000',
                        },
                    },
                }
            },
            main: {
                filter: 'EVENTS',
                search: {
                    EVENTS: {
                        lastRequestParams: {page: 1},
                        fulltext: undefined,
                        currentSearch: undefined
                    },
                }
            }
        };
        const newEvent = {
            _id: 'e2',
            name: 'Event2',
            dates: {
                start: '2017-06-30T12:37:11+0000',
                end: '2017-06-30T13:37:11+0000',
            },
        };

        let store;
        let apiSpy;
        let spyGetById;
        let spyQuery;
        let $rootScope;
        let spyQueryResult;
        const delay = 0;

        // Store the window.setTimeout so we can restore it after our tests
        let originalSetTimeout = window.setTimeout;

        beforeEach(inject((_$rootScope_) => {
            // Mock window.setTimeout
            jasmine.getGlobal().setTimeout = (func) => func();

            $rootScope = _$rootScope_;

            spyGetById = sinon.spy(() => Promise.resolve(newEvent));
            spyQuery = sinon.spy(() => Promise.resolve(spyQueryResult));

            apiSpy = (resource) => ({query: spyQuery});
            apiSpy.find = spyGetById;

            store = createTestStore({
                initialState: cloneDeep(initialState),
                extraArguments: {
                    api: apiSpy,
                },
            });

            registerNotifications($rootScope, store);
            $rootScope.$digest();

            spyQueryResult = {
                _items: [
                    {
                        _id: 'e3',
                        name: 'Event3',
                        recurrence_id: 'r1',
                        dates: {
                            start: '2017-06-30T12:37:11+0000',
                            end: '2017-06-30T13:37:11+0000',
                        },
                    },
                    {
                        _id: 'e4',
                        name: 'Event4',
                        recurrence_id: 'r1',
                        dates: {
                            start: '2017-06-30T12:37:11+0000',
                            end: '2017-06-30T13:37:11+0000',
                        },
                    },
                ],
            };
        }));

        afterEach(() => {
            // Restore window.setTimeout
            jasmine.getGlobal().setTimeout = originalSetTimeout;
        });

        describe('`events:created`', () => {
            it('Adds the Event item to the store', (done) => {
                $rootScope.$broadcast('events:created', {item: 'e2'});

                // Expects run in setTimeout to give the event listener a chance to execute
                originalSetTimeout(() => {
                    expect(spyGetById.callCount).toBe(1);
                    expect(spyGetById.args[0]).toEqual([
                        'events',
                        'e2',
                        {embedded: {files: 1}}
                    ]);

                    expect(selectors.getEvents(store.getState())).toEqual({
                        e1: {
                            _id: 'e1',
                            name: 'Event1',
                            dates: {
                                start: moment('2017-05-31T16:37:11+0000'),
                                end: moment('2017-05-31T17:37:11+0000'),
                            },
                        },
                        e2: {
                            _id: 'e2',
                            name: 'Event2',
                            dates: {
                                start: moment('2017-06-30T12:37:11+0000'),
                                end: moment('2017-06-30T13:37:11+0000'),
                            },
                            _type: 'events',
                        },
                    });
                    done();
                }, delay);
            });

            it('Silently returns if no event provided', (done) => {
                $rootScope.$broadcast('events:created', {});

                // Expects run in setTimeout to give the event listener a chance to execute
                originalSetTimeout(() => {
                    expect(spyGetById.callCount).toBe(0);
                    expect(selectors.getEvents(store.getState())).toEqual({
                        e1: {
                            _id: 'e1',
                            name: 'Event1',
                            dates: {
                                start: moment('2017-05-31T16:37:11+0000'),
                                end: moment('2017-05-31T17:37:11+0000'),
                            },
                        },
                    });
                    done();
                }, delay);
            });
        });

        describe('`events:created:recurring`', () => {
            it('Adds the Events to the store', (done) => {
                $rootScope.$broadcast('events:created:recurring', {item: 'r1'});
                $rootScope.$digest();

                // Expects run in setTimeout to give the event listener a change to execute
                originalSetTimeout(() => {
                    expect(spyQuery.callCount).toBe(2);
                    expect(spyQuery.args[0]).toEqual([{
                        page: 1,
                        max_results: 25,
                        sort: '[("dates.start",1)]',
                        embedded: {files: 1},
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [
                                        {term: {recurrence_id: 'r1'}},
                                    ],
                                    must_not: [
                                        {term: {state: 'spiked'}},
                                    ],
                                },
                            },
                            filter: {},
                        }),
                    }]);

                    expect(selectors.getEvents(store.getState())).toEqual({
                        e1: {
                            _id: 'e1',
                            name: 'Event1',
                            dates: {
                                start: moment('2017-05-31T16:37:11+0000'),
                                end: moment('2017-05-31T17:37:11+0000'),
                            },
                        },
                        e3: {
                            _id: 'e3',
                            name: 'Event3',
                            recurrence_id: 'r1',
                            dates: {
                                start: moment('2017-06-30T12:37:11+0000'),
                                end: moment('2017-06-30T13:37:11+0000'),
                            },
                            _type: 'events',
                        },
                        e4: {
                            _id: 'e4',
                            name: 'Event4',
                            recurrence_id: 'r1',
                            dates: {
                                start: moment('2017-06-30T12:37:11+0000'),
                                end: moment('2017-06-30T13:37:11+0000'),
                            },
                            _type: 'events',
                        },
                    });

                    done();
                }, delay);
            });

            it('Silently returns if no recurring event provided', (done) => {
                $rootScope.$broadcast('events:created:recurring', {});

                // Expects run in setTimeout to give the event listener a chance to execute
                originalSetTimeout(() => {
                    expect(spyGetById.callCount).toBe(0);
                    expect(selectors.getEvents(store.getState())).toEqual({
                        e1: {
                            _id: 'e1',
                            name: 'Event1',
                            dates: {
                                start: moment('2017-05-31T16:37:11+0000'),
                                end: moment('2017-05-31T17:37:11+0000'),
                            },
                        },
                    });
                    done();
                }, delay);
            });
        });

        describe('`events:updated`', () => {
            it('Refetches the current list of events', (done) => {
                spyQueryResult = {
                    _items: [{
                        _id: 'e1',
                        name: 'Event1 Updated',
                        dates: {
                            start: '2017-05-31T17:00:00+0000',
                            end: '2017-05-31T18:00:00+0000',
                        },
                    }],
                };

                $rootScope.$broadcast('events:updated', {item: 'e1'});

                originalSetTimeout(() => {
                    expect(spyQuery.callCount).toBe(1);
                    expect(selectors.getEvents(store.getState())).toEqual({
                        e1: {
                            _id: 'e1',
                            name: 'Event1 Updated',
                            dates: {
                                start: moment('2017-05-31T17:00:00+0000'),
                                end: moment('2017-05-31T18:00:00+0000'),
                            },
                            _type: 'events'
                        },
                    });
                    done();
                }, delay);
            });

            it('Event silently returns if no event provided', (done) => {
                $rootScope.$broadcast('events:updated', {});

                originalSetTimeout(() => {
                    expect(spyQuery.callCount).toBe(0);
                    expect(selectors.getEvents(store.getState())).toEqual({
                        e1: {
                            _id: 'e1',
                            name: 'Event1',
                            dates: {
                                start: moment('2017-05-31T16:37:11+0000'),
                                end: moment('2017-05-31T17:37:11+0000'),
                            },
                        },
                    });
                    done();
                }, delay);
            });
        });
    });
});
