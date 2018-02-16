import events, {spikeEvent, unspikeEvent} from '../events';
import {cloneDeep} from 'lodash';

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
                    state: 'draft',
                    _etag: 'e456',
                },
                e3: {
                    _id: 'e3',
                    name: 'name 3',
                    dates: {start: '2015-10-15T14:01:11+0000'},
                    state: 'draft',
                    _etag: 'e789',
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
                    item: 'e1',
                    items: [{
                        id: 'e1',
                        etag: 'e123'
                    }],
                    state: 'scheduled',
                    pubstatus: 'usable',
                },
            });

            expect(result.events.e1).toEqual({
                ...items.e1,
                state: 'scheduled',
                pubstatus: 'usable',
                _etag: 'e123',
            });
        });

        it('MARK_EVENT_PUBLISHED on multiple events', () => {
            initialState.events = items;
            const result = events(initialState, {
                type: 'MARK_EVENT_PUBLISHED',
                payload: {
                    item: 'e1',
                    items: [
                        {id: 'e1', etag: 'e123'},
                        {id: 'e2', etag: 'e456'},
                        {id: 'e3', etag: 'e789'},
                    ],
                    state: 'scheduled',
                    pubstatus: 'usable',
                },
            });

            expect(result.events.e1).toEqual({
                ...items.e1,
                state: 'scheduled',
                pubstatus: 'usable',
                _etag: 'e123',
            });

            expect(result.events.e2).toEqual({
                ...items.e2,
                state: 'scheduled',
                pubstatus: 'usable',
                _etag: 'e456',
            });

            expect(result.events.e3).toEqual({
                ...items.e3,
                state: 'scheduled',
                pubstatus: 'usable',
                _etag: 'e789',
            });
        });

        it('MARK_EVENT_UNPUBLISHED', () => {
            initialState.events = items;
            const result = events(initialState, {
                type: 'MARK_EVENT_UNPUBLISHED',
                payload: {
                    item: 'e1',
                    items: [{
                        id: 'e1',
                        etag: 'e123'
                    }],
                    state: 'killed',
                    pubstatus: 'cancelled',
                },
            });

            expect(result.events.e1).toEqual({
                ...items.e1,
                state: 'killed',
                pubstatus: 'cancelled',
                _etag: 'e123',
            });
        });

        it('MARK_EVENT_UNPUBLISHED on multiple events', () => {
            initialState.events = items;
            const result = events(initialState, {
                type: 'MARK_EVENT_UNPUBLISHED',
                payload: {
                    item: 'e1',
                    items: [
                        {id: 'e1', etag: 'e123'},
                        {id: 'e2', etag: 'e456'},
                        {id: 'e3', etag: 'e789'},
                    ],
                    state: 'killed',
                    pubstatus: 'cancelled',
                },
            });

            expect(result.events.e1).toEqual({
                ...items.e1,
                state: 'killed',
                pubstatus: 'cancelled',
                _etag: 'e123',
            });

            expect(result.events.e2).toEqual({
                ...items.e2,
                state: 'killed',
                pubstatus: 'cancelled',
                _etag: 'e456',
            });

            expect(result.events.e3).toEqual({
                ...items.e3,
                state: 'killed',
                pubstatus: 'cancelled',
                _etag: 'e789',
            });
        });

        describe('spikeEvent', () => {
            const payload = {
                item: 'e1',
                user: 'ident1',
                items: [{
                    id: 'e1',
                    etag: 'e456',
                    revert_state: 'draft'
                }],
                filteredSpikeState: 'draft'
            };

            it('marks the event as spiked', () => {
                const events = cloneDeep(items);

                spikeEvent(
                    events,
                    initialState.eventsInList,
                    'draft',
                    payload.items[0]
                );

                expect(events.e1).toEqual({
                    ...items.e1,
                    _etag: 'e456',
                    state: 'spiked',
                    revert_state: 'draft',
                });
            });

            it('removes spiked event from list if not viewing spiked events', () => {
                let events = cloneDeep(items);
                let eventsInList = ['e1'];

                spikeEvent(
                    events,
                    eventsInList,
                    'draft',
                    payload.items[0]
                );

                expect(eventsInList).toEqual([]);

                events = cloneDeep(items);
                eventsInList = ['e1'];
                spikeEvent(
                    events,
                    eventsInList,
                    'both',
                    payload.items[0]
                );
                expect(eventsInList).toEqual(['e1']);

                events = cloneDeep(items);
                eventsInList = ['e1'];
                spikeEvent(
                    events,
                    eventsInList,
                    'spiked',
                    payload.items[0]
                );
                expect(eventsInList).toEqual(['e1']);
            });
        });

        it('SPIKE_EVENT returns if spiked event not loaded', () => {
            const result = events(initialState, {
                type: 'SPIKE_EVENT',
                payload: {
                    item: 'e6',
                    user: 'ident1',
                    items: [{
                        id: 'e6',
                        etag: 'e456',
                        revert_state: 'draft'
                    }],
                    filteredSpikeState: 'draft'
                }
            });

            expect(result).toEqual(initialState);
        });

        it('SPIKE_EVENT spikes multiple items', () => {
            const state = {
                ...initialState,
                events: cloneDeep(items)
            };

            const result = events(state, {
                type: 'SPIKE_EVENT',
                payload: {
                    item: 'e1',
                    user: 'ident1',
                    items: [{
                        id: 'e1',
                        etag: 'p123',
                        revert_state: 'draft'
                    }, {
                        id: 'e2',
                        etag: 'p456',
                        revert_state: 'rescheduled'
                    }, {
                        id: 'e3',
                        etag: 'p789',
                        revert_state: 'postponed'
                    }],
                    filteredSpikeState: 'draft'
                }
            });

            expect(result.events).toEqual({
                e1: {
                    ...items.e1,
                    state: 'spiked',
                    _etag: 'p123',
                    revert_state: 'draft'
                },
                e2: {
                    ...items.e2,
                    state: 'spiked',
                    _etag: 'p456',
                    revert_state: 'rescheduled'
                },
                e3: {
                    ...items.e3,
                    state: 'spiked',
                    _etag: 'p789',
                    revert_state: 'postponed'
                }
            });
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
    });
});
