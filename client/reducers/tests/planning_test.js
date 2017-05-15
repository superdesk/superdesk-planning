import planning from '../planning'

describe('planning', () => {
    describe('reducers', () => {
        // Ensure we set the default state for planning
        let initialState
        beforeEach(() => {
            initialState = planning(undefined, { type: null })
        })

        const item = { _id: 'p1' }

        it('initialState', () => {
            expect(initialState).toEqual({
                plannings: {},
                currentPlanningId: undefined,
                editorOpened: false,
                planningsAreLoading: false,
                onlyFuture: true,
                filterPlanningKeyword: null,
            })
        })

        it('REQUEST_PLANINGS', () => {
            const result = planning(
                initialState,
                { type: 'REQUEST_PLANINGS' }
            )

            expect(result.planningsAreLoading).toBe(true)
        })

        it('RECEIVE_PLANNINGS', () => {
            const result = planning(
                initialState,
                {
                    type: 'RECEIVE_PLANNINGS',
                    payload: [item],
                }
            )

            expect(result.plannings).toEqual({ p1: item })
        })

        it('DELETE_PLANNING', () => {
            const newState = planning(
                initialState,
                {
                    type: 'RECEIVE_PLANNINGS',
                    payload: [item],
                }
            )
            const result = planning(
                newState,
                {
                    type: 'DELETE_PLANNING',
                    payload: item._id,
                }
            )

            expect(result.plannings).toEqual({})
        })

        it('OPEN_PLANNING_EDITOR', () => {
            const result = planning(
                initialState,
                {
                    type: 'OPEN_PLANNING_EDITOR',
                    payload: 'p1',
                }
            )

            expect(result.editorOpened).toBe(true)
            expect(result.currentPlanningId).toBe('p1')
        })

        it('CLOSE_PLANNING_EDITOR', () => {
            const result = planning(
                initialState,
                { type: 'CLOSE_PLANNING_EDITOR' }
            )

            expect(result.editorOpened).toBe(false)
            expect(result.currentPlanningId).toBe(null)
        })

        it('SET_ONLY_FUTURE', () => {
            let result = planning(
                initialState,
                {
                    type: 'SET_ONLY_FUTURE',
                    payload: false,
                }
            )
            expect(result.onlyFuture).toBe(false)

            result = planning(
                result,
                {
                    type: 'SET_ONLY_FUTURE',
                    payload: true,
                }
            )
            expect(result.onlyFuture).toBe(true)
        })
    })
})
