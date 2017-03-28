import events from '../events'

describe('events', () => {
    const state = {
        events: {
            1: {
                _id: '1',
                name: 'name 1',
                dates: { start: '2016-10-15T13:01:11+0000' },
            },
            2: {
                _id: '2',
                name: 'name 2',
                dates: { start: '2014-10-15T14:01:11+0000' },
            },
            3: {
                _id: '3',
                name: 'name 3',
                dates: { start: '2015-10-15T14:01:11+0000' },
            },
        },
        eventsInList: [],
    }
    it('SET_EVENTS_LIST with right order', () => {
        const result = events(state, {
            type: 'SET_EVENTS_LIST',
            payload: ['1', '2', '3'],
        })
        expect(result.eventsInList).toEqual(['1', '3', '2'])
    })
    it('ADD_TO_EVENTS_LIST', () => {
        const result = events({
            ...state,
            eventsInList: ['1', '2'],
        }, {
            type: 'ADD_TO_EVENTS_LIST',
            payload: ['3', '1'],
        })
        expect(result.eventsInList).toEqual(['1', '3', '2'])
    })
    it('ADD_EVENTS', () => {
        const newEvent = {
            _id: '4',
            name: 'name 4',
            dates: { start: Date() },
        }
        const result = events(state, {
            type: 'ADD_EVENTS',
            payload: [newEvent],
        })
        expect(result).not.toBe(state)
        expect(result).not.toEqual(state)
        expect(Object.keys(result.events)).toEqual(['1', '2', '3', '4'])
    })
})
