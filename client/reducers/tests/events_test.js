import events from '../events'

describe('events', () => {
    it('ADD_EVENTS', () => {
        let result
        const state = [
            { _id: '1', name: 'name 1', dates: { start: Date() } },
            { _id: '2', name: 'name 2', dates: { start: Date() } },
        ]
        const newEvent = { _id: '3', name: 'name 3', dates: { start: Date() } }
        result = events(state, { type: 'ADD_EVENTS', events: [newEvent] })
        expect(result).not.toBe(state)
        expect(result).not.toEqual(state)
        expect(result).toEqual(state.concat(newEvent))
    })
})
