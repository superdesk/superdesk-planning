import agenda from '../agenda'

describe('agenda', () => {
    describe('reducers', () => {
        // Ensure we set the default state for agenda
        let initialState
        beforeEach(() => { initialState = agenda(undefined, { type: null }) })

        const item = {
            _id: 'a1',
            name: 'Agenda',
        }

        it('initialState', () => {
            expect(initialState).toEqual({
                agendas: [],
                currentPlanningId: undefined,
                agendasAreLoading: false,
            })
        })

        it('REQUEST_AGENDAS', () => {
            const result = agenda(initialState, { type: 'REQUEST_AGENDAS' })

            expect(result.agendasAreLoading).toBe(true)
        })

        it('RECEIVE_AGENDAS', () => {
            const result = agenda(
                initialState,
                {
                    type: 'RECEIVE_AGENDAS',
                    payload: [item],
                }
            )

            expect(result.agendasAreLoading).toBe(false)
            expect(result.agendas).toEqual([item])
        })

        it('SELECT_AGENDA', () => {
            expect(initialState.currentAgendaId).toBe(undefined)
            const result = agenda(
                initialState,
                {
                    type: 'SELECT_AGENDA',
                    payload: 'a1',
                }
            )

            expect(result.currentAgendaId).toBe('a1')
        })

        describe('ADD_OR_REPLACE_AGENDA', () => {
            it('add agenda', () => {
                const result = agenda(initialState, {
                    type: 'ADD_OR_REPLACE_AGENDA',
                    payload: item,
                })

                expect(result.agendas).toEqual([item])
            })

            it('replace agenda', () => {
                const newState = agenda(initialState, {
                    type: 'ADD_OR_REPLACE_AGENDA',
                    payload: item,
                })

                const result = agenda(newState, {
                    type: 'ADD_OR_REPLACE_AGENDA',
                    payload:
                    {
                        ...item,
                        name: 'Agenda Reloaded',
                    },
                })

                expect(result.agendas.length).toBe(1)
                expect(result.agendas[0].name).toBe('Agenda Reloaded')
            })
        })
    })
})
