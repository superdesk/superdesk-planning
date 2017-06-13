import planning from '../planning'

describe('planning', () => {
    describe('reducers', () => {
        // Ensure we set the default state for planning
        let initialState
        beforeEach(() => {
            initialState = planning(undefined, { type: null })
        })

        const plannings = {
            p1: {
                _id: 'p1',
                slugline: 'Plan1',
                coverages: [{
                    _id: 'c1',
                    planning_item: 'p1',
                }],
            },
        }

        it('initialState', () => {
            expect(initialState).toEqual({
                plannings: {},
                currentPlanningId: undefined,
                editorOpened: false,
                planningsAreLoading: false,
                onlyFuture: true,
                filterPlanningKeyword: null,
                onlySpiked: false,
                readOnly: true,
            })
        })

        it('REQUEST_PLANNINGS', () => {
            const result = planning(
                initialState,
                { type: 'REQUEST_PLANNINGS' }
            )

            expect(result.planningsAreLoading).toBe(true)
        })

        describe('RECEIVE_PLANNINGS', () => {
            it('saves the plan to the store', () => {
                const result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_PLANNINGS',
                        payload: [{
                            _id: 'p1',
                            coverages: [{ _id: 'c1' }],
                        }],
                    }
                )

                expect(result.plannings).toEqual({
                    p1: {
                        _id: 'p1',
                        coverages: [{ _id: 'c1' }],
                    },
                })
            })

            it('defaults coverages to empty array', () => {
                const result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_PLANNINGS',
                        payload: [{ _id: 'p1' }],
                    }
                )

                expect(result.plannings).toEqual({
                    p1: {
                        _id: 'p1',
                        coverages: [],
                    },
                })
            })

            it('converts payload to array', () => {
                const result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_PLANNINGS',
                        payload: { _id: 'p1' },
                    }
                )

                expect(result.plannings).toEqual({
                    p1: {
                        _id: 'p1',
                        coverages: [],
                    },
                })
            })
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
            expect(result.readOnly).toBe(false)
        })

        it('PREVIEW_PLANNING', () => {
            const result = planning(
                initialState,
                {
                    type: 'PREVIEW_PLANNING',
                    payload: 'p1',
                }
            )

            expect(result.editorOpened).toBe(true)
            expect(result.currentPlanningId).toBe('p1')
            expect(result.readOnly).toBe(true)
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

        it('SET_ONLY_SPIKED', () => {
            let result = planning(
                initialState,
                {
                    type: 'SET_ONLY_SPIKED',
                    payload: true,
                }
            )
            expect(result.onlySpiked).toBe(true)

            result = planning(
                initialState,
                {
                    type: 'SET_ONLY_SPIKED',
                    payload: false,
                }
            )
            expect(result.onlySpiked).toBe(false)
        })

        it('PLANNING_FILTER_BY_KEYWORD', () => {
            let result = planning(
                initialState,
                {
                    type: 'PLANNING_FILTER_BY_KEYWORD',
                    payload: 'Find this plan',
                }
            )
            expect(result.filterPlanningKeyword).toBe('Find this plan')
        })

        describe('RECEIVE_COVERAGE', () => {
            it('planning not loaded', () => {
                initialState.plannings = plannings
                let result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_COVERAGE',
                        payload: {
                            item: 'c1',
                            planning: 'p2',
                        },
                    }
                )

                expect(result).toEqual(initialState)
            })

            it('coverage created', () => {
                initialState.plannings = plannings

                let result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_COVERAGE',
                        payload: {
                            _id: 'c2',
                            planning_item: 'p1',
                        },
                    }
                )

                expect(result.plannings.p1.coverages).toEqual([
                    {
                        _id: 'c1',
                        planning_item: 'p1',
                    },
                    {
                        _id: 'c2',
                        planning_item: 'p1',
                    },
                ])
            })

            it('coverage updated', () => {
                initialState.plannings = plannings

                let result = planning(
                    initialState,
                    {
                        type: 'RECEIVE_COVERAGE',
                        payload: {
                            _id: 'c1',
                            planning_item: 'p1',
                            foo: 'bar',
                        },
                    }
                )

                expect(result.plannings.p1.coverages).toEqual([{
                    _id: 'c1',
                    planning_item: 'p1',
                    foo: 'bar',
                }])
            })
        })

        describe('COVERAGE_DELETED', () => {
            it('when planning not loaded', () => {
                initialState.plannings = plannings

                let result = planning(
                    initialState,
                    {
                        type: 'COVERAGE_DELETED',
                        payload: {
                            _id: 'c2',
                            planning_item: 'p2',
                        },
                    }
                )

                expect(result).toEqual(initialState)
            })

            it('coverage not loaded', () => {
                initialState.plannings = plannings

                let result = planning(
                    initialState,
                    {
                        type: 'COVERAGE_DELETED',
                        payload: {
                            _id: 'c2',
                            planning_item: 'p1',
                        },
                    }
                )

                expect(result).toEqual(initialState)
            })

            it('removes coverage', () => {
                initialState.plannings = plannings

                let result = planning(
                    initialState,
                    {
                        type: 'COVERAGE_DELETED',
                        payload: {
                            _id: 'c1',
                            planning_item: 'p1',
                        },
                    }
                )

                expect(result.plannings.p1.coverages).toEqual([])
            })
        })
    })
})
