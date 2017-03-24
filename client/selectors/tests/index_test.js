import * as selectors from '../index'
import { cloneDeep } from 'lodash'

describe('selectors', () => {
    const state = {
        events: {
            events: [
                { _id: 'event1' },
                { _id: 'event2' },
            ],
            showEventDetails: 'event1',
        },
        planning: {
            plannings: {
                a: {
                    name: 'name a',
                    event_item: 'event1',
                },
                b: { name: 'name b' },
            },
            currentAgendaId: '1',
            agendas: [{
                _id: '1',
                name: 'name',
                planning_items: ['a', 'b'],
            }],
        },
    }
    it('getCurrentAgenda', () => {
        let result
        result = selectors.getCurrentAgenda(state)
        expect(result).toEqual(state.planning.agendas[0])
        const newState = cloneDeep(state)
        delete newState.planning.currentAgendaId
        result = selectors.getCurrentAgenda(newState)
        expect(result).toEqual(undefined)
    })
    it('getCurrentAgendaPlannings', () => {
        let result
        // normal
        result = selectors.getCurrentAgendaPlannings(state)
        expect(result).toEqual([state.planning.plannings.a, state.planning.plannings.b])
        // without planning_items
        let newState
        newState = cloneDeep(state)
        delete newState.planning.agendas[0].planning_items
        result = selectors.getCurrentAgendaPlannings(newState)
        expect(result).toEqual([])
        // without currentAgendaId
        newState = cloneDeep(state)
        delete newState.planning.currentAgendaId
        result = selectors.getCurrentAgendaPlannings(newState)
        expect(result).toEqual([])
    })
    it('getEventsWithMoreInfo', () => {
        const events = selectors.getEventsWithMoreInfo(state)
        expect(events.length).toBe(2)
        expect(events.find((e) => e._id === 'event1')._hasPlanning).toBe(true)
        expect(events.find((e) => e._id === 'event2')._hasPlanning).toBe(false)
    })
    it('getEventToBeDetailed', () => {
        const event = selectors.getEventToBeDetailed(state)
        expect(event._plannings.length).toBe(1)
        expect(event._plannings[0]._agenda.name).toBe('name')
    })
})
