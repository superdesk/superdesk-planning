import * as selectors from '../index'
import { cloneDeep } from 'lodash'

describe('selectors', () => {
    it('getCurrentAgenda', () => {
        let result
        let state = {
            planning: {
                agendas: [{ _id: '1', name: 'name' }],
            }
        }
        result = selectors.getCurrentAgenda(state)
        expect(result).toEqual(undefined)
        state = cloneDeep(state)
        state.planning.currentAgendaId = '1'
        result = selectors.getCurrentAgenda(state)
        expect(result).toEqual(state.planning.agendas[0])
    })
    it('getCurrentAgendaPlannings', () => {
        let result
        let state = {
            planning: {
                plannings: {
                    a: { name: 'name a', _created: '2017-03-20T07:22:28.000Z' },
                    b: { name: 'name b', _created: '2017-03-20T06:22:28.000Z' },
                },
                currentAgendaId: '1',
                agendas: [{ _id: '1', name: 'name', planning_items: ['a', 'b'] }],
            }
        }
        // normal
        result = selectors.getCurrentAgendaPlannings(state)
        expect(result).toEqual([state.planning.plannings.a, state.planning.plannings.b])
        // without planning_items
        state = cloneDeep(state)
        delete state.planning.agendas[0].planning_items
        result = selectors.getCurrentAgendaPlannings(state)
        expect(result).toEqual([])
        // without currentAgendaId
        state = cloneDeep(state)
        delete state.planning.currentAgendaId
        result = selectors.getCurrentAgendaPlannings(state)
        expect(result).toEqual([])
    })
    it('getEventsWithMoreInfo', () => {
        const state = {
            events: {
                events: [
                    { _id: 'event1' },
                    { _id: 'event2' },
                ]
            },
            planning: {
                plannings: {
                    a: { name: 'name a', event_item: { _id: 'event1' } },
                    b: { name: 'name b' },
                },
                currentAgendaId: '1',
                agendas: [{ _id: '1', name: 'name', planning_items: ['a', 'b'] }],
            }
        }
        const events = selectors.getEventsWithMoreInfo(state)
        expect(events.length).toBe(2)
        expect(events.find((e) => e._id === 'event1')._hasPlanning).toBe(true)
        expect(events.find((e) => e._id === 'event2')._hasPlanning).toBe(false)
    })
})
