import privileges from '../privileges'

describe('privileges', () => {
    describe('reducers', () => {
        // Ensure we set the default state for privileges
        let initialState
        beforeEach(() => { initialState = privileges(undefined, { type: null })})

        it('initialState', () => {
            expect(initialState).toEqual({})
        })

        it('RECEIVE_PRIVILEGES', () => {
            const result = privileges(initialState, {
                type: 'RECEIVE_PRIVILEGES',
                payload: { planning: 1 },
            })
            expect(result).toEqual({ planning: 1 })
        })
    })
})
