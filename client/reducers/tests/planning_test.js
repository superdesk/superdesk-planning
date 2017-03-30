import planning from '../planning'

describe('planning', () => {
    const state = {
        agendas: [],
        plannings: { p1: {} },
        currentAgendaId: undefined,
        currentPlanningId: undefined,
        editorOpened: false,
        agendasAreLoading: false,
        planningsAreLoading: false,
    }
    it('ADD_OR_REPLACE_AGENDA', () => {
        const agenda = {
            _id: 'agenda1',
            name: 'name',
            planning_type: 'agenda',
        }
        const result = planning(state, {
            type: 'ADD_OR_REPLACE_AGENDA',
            payload: agenda,
        })
        expect(result.agendas).toEqual([agenda])
    })
    it('DELETE_PLANNING', () => {
        const result = planning(state, {
            type: 'DELETE_PLANNING',
            payload: 'p1',
        })
        expect(Object.keys(state.plannings)).toEqual(['p1'])
        expect(Object.keys(result.plannings)).toEqual([])
    })
})
