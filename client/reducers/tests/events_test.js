import events from '../events'

describe('events', () => {
    describe('reducers', () => {
        // Ensure we set the default state for agenda
        let initialState
        beforeEach(() => { initialState = events(undefined, { type: null }) })

        it('initialState', () => {
            expect(initialState).toEqual({
                events: {},
                eventsInList: [],
                lastRequestParams: { page: 1 },
                search: {
                    currentSearch: undefined,
                    advancedSearchOpened: false,
                },
                show: true,
                showEventDetails: null,
                selectedEvent: null,
                readOnly: true,
            })
        })

        const items = {
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
        }

        it('TOGGLE_EVENT_LIST', () => {
            const result = events(initialState, { type: 'TOGGLE_EVENT_LIST' })
            expect(result.show).toBe(false)
        })

        it('REQUEST_EVENTS', () => {
            const result = events(initialState, {
                type: 'REQUEST_EVENTS',
                payload: {},
            })
            expect(result.search).toEqual({
                currentSearch: {},
                advancedSearchOpened: false,
            })
        })

        it('ADD_EVENTS', () => {
            initialState.events = items
            const newEvent = {
                _id: '4',
                name: 'name 4',
                dates: { start: '2016-10-15T14:30+0000' },
            }
            const result = events(initialState, {
                type: 'ADD_EVENTS',
                payload: [newEvent],
            })
            expect(result).not.toBe(initialState)
            expect(result).not.toEqual(initialState)
            expect(Object.keys(result.events)).toEqual(['1', '2', '3', '4'])
        })

        it('SET_EVENTS_LIST with right order', () => {
            initialState.events = items
            const result = events(initialState, {
                type: 'SET_EVENTS_LIST',
                payload: ['1', '2', '3'],
            })
            expect(result.eventsInList).toEqual(['1', '3', '2'])
        })

        it('ADD_TO_EVENTS_LIST', () => {
            initialState.events = items
            const result = events({
                ...initialState,
                eventsInList: ['1', '2'],
            }, {
                type: 'ADD_TO_EVENTS_LIST',
                payload: ['3', '1'],
            })
            expect(result.eventsInList).toEqual(['1', '3', '2'])
        })

        it('OPEN_ADVANCED_SEARCH', () => {
            const result = events(initialState, { type: 'OPEN_ADVANCED_SEARCH' })
            expect(result.search).toEqual({
                currentSearch: undefined,
                advancedSearchOpened: true,
            })
        })

        it('CLOSE_ADVANCED_SEARCH', () => {
            const result = events(initialState, { type: 'CLOSE_ADVANCED_SEARCH' })
            expect(result.search).toEqual({
                currentSearch: undefined,
                advancedSearchOpened: false,
            })
        })

        it('OPEN_EVENT_DETAILS', () => {
            const result = events(initialState, {
                type: 'OPEN_EVENT_DETAILS',
                payload: '1',
            })
            expect(result.showEventDetails).toBe('1')
            expect(result.selectedEvent).toBe('1')
            expect(result.readOnly).toBe(false)
        })

        it('CLOSE_EVENT_DETAILS', () => {
            const result = events(initialState, { type: 'CLOSE_EVENT_DETAILS' })
            expect(result.showEventDetails).toBe(null)
        })
    })
})
