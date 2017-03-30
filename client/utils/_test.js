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
})
