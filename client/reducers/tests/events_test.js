import events, {spikeEvent, unspikeEvent} from '../events';

describe('events', () => {
    describe('reducers', () => {
        // Ensure we set the default state for agenda
        let initialState;
        let items;

        beforeEach(() => {
            initialState = events(undefined, {type: null});
            items = {
                e1: {
                    _id: 'e1',
                    name: 'name 1',
                    dates: {start: '2016-10-15T13:01:11+0000'},
                    _etag: 'e123',
                    state: 'draft',
                    lock_action: 'spike',
                    lock_user: 'user1',
                    lock_time: '2016-10-16T13:01:11+0000',
                    lock_session: 'session2',
                },
                e2: {
                    _id: 'e2',
                    name: 'name 2',
                    dates: {start: '2014-10-15T14:01:11+0000'},
                },
                e3: {
                    _id: 'e3',
                    name: 'name 3',
                    dates: {start: '2015-10-15T14:01:11+0000'},
                },
            };
        });

        it('initialState', () => {
            expect(initialState).toEqual({
                events: {},
                eventsInList: [],
                selectedEvents: [],
                readOnly: true,
                eventHistoryItems: [],
            });
        });

        it('ADD_EVENTS', () => {
            initialState.events = items;
            const newEvent = {
                _id: 'e4',
                name: 'name 4',
                dates: {start: '2016-10-15T14:30+0000'},
            };
            const result = events(initialState, {
                type: 'ADD_EVENTS',
                payload: [newEvent],
            });

            expect(result).not.toBe(initialState);
            expect(result).not.toEqual(initialState);
            expect(Object.keys(result.events)).toEqual(['e1', 'e2', 'e3', 'e4']);
        });

        it('SET_EVENTS_LIST with right order', () => {
            initialState.events = items;
            const result = events(initialState, {
                type: 'SET_EVENTS_LIST',
                payload: ['e1', 'e2', 'e3'],
            });

            expect(result.eventsInList).toEqual(['e1', 'e3', 'e2']);
        });

        it('ADD_TO_EVENTS_LIST', () => {
            initialState.events = items;
            const result = events({
                ...initialState,
                eventsInList: ['e1', 'e2'],
            }, {
                type: 'ADD_TO_EVENTS_LIST',
                payload: ['e3', 'e1'],
            });

            expect(result.eventsInList).toEqual(['e1', 'e3', 'e2']);
        });

        it('MARK_EVENT_PUBLISHED', () => {
            initialState.events = items;
            const result = events(initialState, {
                type: 'MARK_EVENT_PUBLISHED',
                payload: {
                    event: {
                        _id: 'e1',
                        state: 'scheduled',
                        pubstatus: 'usable',
                        _etag: 'e123',
                    },
                },
            });

            expect(result.events.e1).toEqual({
                ...items.e1,
                state: 'scheduled',
                pubstatus: 'usable',
                _etag: 'e123',
            });
        });

        it('MARK_EVENT_UNPUBLISHED', () => {
            initialState.events = items;
            const result = events(initialState, {
                type: 'MARK_EVENT_UNPUBLISHED',
                payload: {
                    event: {
                        _id: 'e1',
                        state: 'killed',
                        pubstatus: 'cancelled',
                        _etag: 'e123',
                    },
                },
            });

            expect(result.events.e1).toEqual({
                ...items.e1,
                state: 'killed',
                pubstatus: 'cancelled',
                _etag: 'e123',
            });
        });

        describe('spikeEvent', () => {
            const payload = {
                event: {
                    _id: 'e1',
                    _etag: 'e456',
                    revert_state: 'draft',
                },
                spikeState: 'draft'
            };

            it('marks the event as spiked', () => {
                const result = spikeEvent(
                    {
                        ...initialState,
                        events: items,
                    },
                    payload
                );

                expect(result.events.e1).toEqual({
                    _id: 'e1',
                    name: 'name 1',
                    dates: {start: '2016-10-15T13:01:11+0000'},
                    _etag: 'e456',
                    state: 'spiked',
                    revert_state: 'draft',
                });
            });

            it('removes spiked event from list if not viewing spiked events', () => {
                let result = spikeEvent(
                    {
                        ...initialState,
                        events: items,
                        eventsInList: ['e1'],
                    },
                    payload
                );

                expect(result.eventsInList).toEqual([]);

                result = spikeEvent(
                    {
                        ...initialState,
                        events: items,
                        eventsInList: ['e1'],
                        search: {currentSearch: {spikeState: 'both'}},
                    },
                    {
                        event: {
                            _id: 'e1',
                            _etag: 'e456',
                            revert_state: 'draft',
                        },
                        spikeState: 'both'
                    }
                );
                expect(result.eventsInList).toEqual(['e1']);

                result = spikeEvent(
                    {
                        ...initialState,
                        events: items,
                        eventsInList: ['e1'],
                    },
                    {
                        event: {
                            _id: 'e1',
                            _etag: 'e456',
                            revert_state: 'draft',
                        },
                        spikeState: 'spiked'
                    }
                );
                expect(result.eventsInList).toEqual(['e1']);
            });
        });

        it('SPIKE_EVENT returns if spiked event not loaded', () => {
            const result = events(initialState, {
                type: 'SPIKE_EVENT',
                payload: {event: {_id: 'e6'}, spikeState: 'draft'},
            });

            expect(result).toEqual(initialState);
        });

        describe('unspikeEvent', () => {
            let payload;

            beforeEach(() => {
                payload = {
                    event: {
                        _id: 'e1',
                        _etag: 'e456',
                        state: 'draft',
                    },
                    spikeState: 'draft'
                };
                initialState.events = {
                    ...items,
                    e1: {
                        ...items.e1,
                        state: 'spiked',
                        revert_state: 'draft',
                    },
                };
            });

            it('reverts the event states', () => {
                const result = unspikeEvent(
                    initialState,
                    payload
                );

                expect(result.events.e1).toEqual({
                    _id: 'e1',
                    name: 'name 1',
                    dates: {start: '2016-10-15T13:01:11+0000'},
                    _etag: 'e456',
                    state: 'draft',
                });
            });

            it('removes unspiked event from list if viewing spiked only events', () => {
                let result = unspikeEvent(
                    {
                        ...initialState,
                        eventsInList: ['e1'],
                    },
                    payload
                );

                expect(result.eventsInList).toEqual(['e1']);

                result = unspikeEvent(
                    {
                        ...initialState,
                        eventsInList: ['e1']
                    },
                    {
                        event: {
                            _id: 'e1',
                            _etag: 'e456',
                            state: 'draft',
                        },
                        spikeState: 'both'
                    }
                );
                expect(result.eventsInList).toEqual(['e1']);

                result = unspikeEvent(
                    {
                        ...initialState,
                        eventsInList: ['e1'],
                    },
                    {
                        event: {
                            _id: 'e1',
                            _etag: 'e456',
                            state: 'draft',
                        },
                        spikeState: 'spiked'
                    }
                );
                expect(result.eventsInList).toEqual([]);
            });
        });

        it('UNSPIKE_EVENT returns if unspiked event not loaded', () => {
            const result = events(initialState, {
                type: 'UNSPIKE_EVENT',
                payload: {event: {_id: 'e6'}, spikeState: 'draft'},
            });

            expect(result).toEqual(initialState);
        });

        it('SPIKE_RECURRING_EVENTS', () => {
            const result = events(
                {
                    ...initialState,
                    events: items,
                },
                {
                    type: 'SPIKE_RECURRING_EVENTS',
                    payload: {
                        events: [{
                            _id: 'e1',
                            _etag: 'e456',
                            revert_state: 'draft',
                        }, {
                            _id: 'e2',
                            _etag: 'e456',
                            revert_state: 'draft',
                        }, {
                            _id: 'e4',
                            _etag: 'e456',
                            revert_state: 'draft',
                        }],
                        spikeState: 'draft'
                    },
                }
            );

            expect(result.events).toEqual({
                e1: {
                    _id: 'e1',
                    name: 'name 1',
                    dates: {start: '2016-10-15T13:01:11+0000'},
                    _etag: 'e456',
                    state: 'spiked',
                    revert_state: 'draft',
                },
                e2: {
                    ...items.e2,
                    _etag: 'e456',
                    state: 'spiked',
                    revert_state: 'draft',
                },
                e3: items.e3,
            });
        });
    });
});
