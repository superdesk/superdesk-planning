import * as selectors from '../index';
import moment from 'moment';
import {keyBy} from 'lodash';

const ids = (day) => day.events.map((e) => e._id);

describe('selectors', () => {
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss';
    const getState = () => ({
        events: {
            events: {
                event1: {
                    _id: 'event1',
                    name: 'event1',
                    dates: {
                        start: moment('2017-01-15T00:00:00', dateFormat),
                        end: moment('2017-01-15T23:59:59', dateFormat),
                    },
                },
                event2: {
                    _id: 'event2',
                    name: 'event2',
                    dates: {
                        start: moment('2017-01-16T08:00:00', dateFormat),
                        end: moment('2017-01-16T14:00:00', dateFormat),
                    },
                },
                event3: {
                    _id: 'event3',
                    name: 'event3',
                    dates: {
                        start: moment('2017-01-14T08:00:00', dateFormat),
                        end: moment('2017-01-17T14:00:00', dateFormat),
                    },
                },
                event4: {
                    _id: 'event4',
                    name: 'event4',
                    dates: {
                        start: moment('2024-07-16T13:00:00+0000'),
                        end: moment('2024-07-17T00:00:00+0000'),
                        no_end_time: true,
                    },
                },
                event5: {
                    _id: 'event5',
                    name: 'event5',
                    dates: {
                        start: moment('2024-07-15T00:00:00+0000'),
                        end: moment('2024-07-18T00:00:00+0000'),
                        all_day: true,
                    },
                }
            },
            eventsInList: ['event1', 'event2', 'event3', 'event4', 'event5'],
        },
        session: {identity: {_id: 'user1'}},
    });

    const setAdvancedSearchDates = (state, startDate, endate?) => {
        state.main = {
            filter: 'EVENTS',
            search: {
                EVENTS: {
                    currentSearch: {
                        advancedSearch: {
                            dates: {
                                start: startDate ? moment(startDate) : null,
                                end: endate ? moment(endate) : null,
                            },
                        },
                    },
                },
            },
        };
    };

    describe('orderedEvents', () => {
        it('all events', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2017-01-10T00:00:00+0000');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2017-01-14',
                '2017-01-15',
                '2017-01-16',
                '2017-01-17',
            ]);

            expect(Object.keys(events).includes('2017-01-17')).toBe(true);

            expect(events['2017-01-14'].events.length).toBe(1);
            expect(events['2017-01-14'].events[0]._id).toBe('event3');
            expect(events['2017-01-15'].events.length).toBe(2);
            expect(events['2017-01-15'].events[0]._id).toBe('event3');
            expect(events['2017-01-15'].events[1]._id).toBe('event1');
            expect(events['2017-01-16'].events.length).toBe(2);
            expect(events['2017-01-16'].events[0]._id).toBe('event3');
            expect(events['2017-01-16'].events[1]._id).toBe('event2');
        });

        it('all events with max start date on 2017-01-17', () => {
            const state = getState();

            state.events.events.event2.dates.start = moment('2017-01-17T08:00:00', dateFormat);
            state.events.events.event2.dates.end = moment('2017-01-17T14:00:00', dateFormat);
            setAdvancedSearchDates(state, '2017-01-10T00:00:00+0000');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2017-01-14',
                '2017-01-15',
                '2017-01-16',
                '2017-01-17',
            ]);

            expect(events['2017-01-14'].events.length).toBe(1);
            expect(events['2017-01-14'].events[0]._id).toBe('event3');
            expect(events['2017-01-15'].events.length).toBe(2);
            expect(events['2017-01-15'].events[0]._id).toBe('event3');
            expect(events['2017-01-15'].events[1]._id).toBe('event1');
            expect(events['2017-01-16'].events.length).toBe(1);
            expect(events['2017-01-16'].events[0]._id).toBe('event3');
            expect(events['2017-01-17'].events.length).toBe(2);
            expect(events['2017-01-17'].events[0]._id).toBe('event3');
            expect(events['2017-01-17'].events[1]._id).toBe('event2');
        });

        it('for today 2017-01-15', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2017-01-15T00:00:00', '2017-01-15T23:59:59');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2017-01-15',
            ]);

            expect(events['2017-01-15'].events.length).toBe(2);
            expect(events['2017-01-15'].events[0]._id).toBe('event3', 'event1');
        });

        it('from 2017-01-15 11:00 to 2017-01-16T14:00:00+0000', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2017-01-15T11:00:00', '2017-01-16T14:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2017-01-15',
                '2017-01-16',
            ]);

            expect(events['2017-01-15'].events.length).toBe(2);
            expect(events['2017-01-15'].events[0]._id).toBe('event3');
            expect(events['2017-01-15'].events[1]._id).toBe('event1');
            expect(events['2017-01-16'].events.length).toBe(2);
            expect(events['2017-01-16'].events[0]._id).toBe('event3');
            expect(events['2017-01-16'].events[1]._id).toBe('event2');
        });

        it('from 2017-01-16T06:00:00+0000 to 2017-01-16T07:00:00+0000', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2017-01-16T06:00:00', '2017-01-16T07:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2017-01-16',
            ]);

            expect(events['2017-01-16'].events.length).toBe(2);
            expect(events['2017-01-16'].events[0]._id).toBe('event3');
            expect(events['2017-01-16'].events[1]._id).toBe('event2');
        });

        it('from 2017-01-16T06:00:00+0000 to 2017-01-16T10:00:00+0000', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2017-01-16T06:00:00', '2017-01-16T10:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2017-01-16',
            ]);

            expect(events['2017-01-16'].events.length).toBe(2);
            expect(events['2017-01-16'].events[0]._id).toBe('event3');
            expect(events['2017-01-16'].events[1]._id).toBe('event2');
        });

        it('from 2017-01-16T13:59:59 to 2017-01-17T08:00:00', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2017-01-16T13:59:59', '2017-01-17T08:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual(['2017-01-16', '2017-01-17']);

            expect(events['2017-01-16'].events.length).toBe(2);
            expect(events['2017-01-16'].events[0]._id).toBe('event3');
            expect(events['2017-01-16'].events[1]._id).toBe('event2');
        });

        it('from 2017-01-17T06:00:00+0000', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2017-01-17T06:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2017-01-17',
            ]);

            expect(events['2017-01-17'].events.length).toBe(1);
            expect(events['2017-01-17'].events[0]._id).toBe('event3');
        });

        it('from 2017-01-18T00:00:00+0000', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2017-01-18T00:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events).length).toBe(0);
        });

        it('from 2024-07-14', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2024-07-14T12:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2024-07-15',
                '2024-07-16',
                '2024-07-17',
                '2024-07-18',
            ]);

            expect(ids(events['2024-07-15'])).toEqual(['event5']);
            expect(ids(events['2024-07-16'])).toEqual(['event5', 'event4']);
            expect(ids(events['2024-07-17'])).toEqual(['event5', 'event4']);
            expect(ids(events['2024-07-18'])).toEqual(['event5']);
        });

        it('from 2024-07-17', () => {
            const state = getState();

            setAdvancedSearchDates(state, '2024-07-17T12:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2024-07-17',
                '2024-07-18',
            ]);

            expect(ids(events['2024-07-17'])).toEqual(['event5', 'event4']);
        });

        it('from 2024-07-14 Toronto timezone', () => {
            moment.tz.setDefault('America/Toronto');
            const state = getState();

            setAdvancedSearchDates(state, '2024-07-14T12:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2024-07-15',
                '2024-07-16',
                '2024-07-17',
                '2024-07-18',
            ]);

            expect(ids(events['2024-07-15'])).toEqual(['event5']);
            expect(ids(events['2024-07-16'])).toEqual(['event5', 'event4']);
            expect(ids(events['2024-07-17'])).toEqual(['event5', 'event4']);
            expect(ids(events['2024-07-18'])).toEqual(['event5']);
        });

        it('from 2024-07-17 Toronto timezone', () => {
            moment.tz.setDefault('America/Toronto');
            const state = getState();

            setAdvancedSearchDates(state, '2024-07-17T05:00:00');
            const events = keyBy(selectors.events.orderedEvents(state), 'date');

            expect(Object.keys(events)).toEqual([
                '2024-07-17',
                '2024-07-18',
            ]);
        });
    });
});
