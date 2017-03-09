import { createTestStore } from '../../../utils'
import * as actions from '../../../actions'

describe('CategoryField', () => {
    it('renders categories', (done) => {
        const store = createTestStore()
        store.dispatch(actions.loadCVocabularies()).then(() => {
            expect(store.getState().vocabularies.categories.length).toBe(2)
            done()
        })
    })
})
