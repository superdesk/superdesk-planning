import * as selectors from '../index'
import { cloneDeep } from 'lodash'

describe('selectors', () => {
    it('getSelectedAgenda', () => {
        let result
        let state = {
            planning: {
                agendas: [{ _id: '1', name: 'name' }],
            }
        }
        result = selectors.getSelectedAgenda(state)
        expect(result).toEqual(undefined)
        state = cloneDeep(state)
        state.planning.currentAgendaId = '1'
        result = selectors.getSelectedAgenda(state)
        expect(result).toEqual(state.planning.agendas[0])
    })
    it('getCurrentAgendaPlannings', () => {
        let result
        let state = {
            planning: {
                plannings: {
                    a: { name: 'name a' },
                    b: { name: 'name b' },
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
})
