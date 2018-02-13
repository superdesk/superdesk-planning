import sinon from 'sinon';
import * as actions from '../../actions';
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
                _type: 'events',
            },
            {
                _id: 'e2',
                name: 'Event 2',
                dates: {
                    start: '2014-10-15T14:01:11+0000',
                    end: '2014-10-15T15:01:11+0000',
                },
                _type: 'events',
            },
            {
                _id: 'e3',
                name: 'Event 3',
                dates: {
                    start: '2015-10-15T14:01:11+0000',
                    end: '2015-10-15T15:01:11+0000',
                },
                _type: 'events',
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

            sinon.stub(eventsUi, 'refetch').callsFake(() => (Promise.resolve()));
        });

        afterEach(() => {
            restoreSinonStub(eventsUi.refetch);
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
});
