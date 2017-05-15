import * as utils from './index'

describe('Utils', function() {
    it('create a store', function() {
        const store = utils.createStore()
        expect(Object.keys(store.getState())).toContain('planning')
    })

    it('create a test store', function() {
        const store = utils.createTestStore()
        expect(Object.keys(store.getState())).toContain('planning')
    })

    it('getErrorMessage returns proper error messages', () => {
        let response = { data: { _message: 'Something happened' } }

        let error = utils.getErrorMessage(response, 'Nothing')
        expect(error).toBe('Something happened')

        response = { data: { _issues: { 'validator exception': 'Something else happened' } } }

        error = utils.getErrorMessage(response, 'Nothing here')
        expect(error).toBe('Something else happened')

        response = { data: {} }
        error = utils.getErrorMessage(response, 'Something unexpected')
        expect(error).toBe('Something unexpected')
    })
})
