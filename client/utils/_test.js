import * as utils from './index'

describe('Utils', function() {
    it('create a store', function() {
        const store = utils.createStore()
        expect(store.getState().planning).toEqual({})
    })

    it('create a test store', function() {
        const store = utils.createTestStore()
        expect(store.getState().planning).toEqual({})
    })
})
