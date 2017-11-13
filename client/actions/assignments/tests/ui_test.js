import assignmentsUi from '../ui'
import assignmentsApi from '../api'
import sinon from 'sinon'
import { getTestActionStore, restoreSinonStub } from '../../../utils/testUtils'

describe('actions.assignments.ui', () => {
    let store
    let services

    const errorMessage = { data: { _message: 'Failed!' } }

    beforeEach(() => {
        store = getTestActionStore()
        services = store.services

        sinon.stub(assignmentsApi, 'link').callsFake(() => (Promise.resolve()))
        sinon.stub(assignmentsApi, 'lock').callsFake((item) => (Promise.resolve(item)))
        sinon.stub(assignmentsApi, 'unlock').callsFake((item) => (Promise.resolve(item)))
    })

    afterEach(() => {
        restoreSinonStub(assignmentsApi.link)
        restoreSinonStub(assignmentsApi.lock)
        restoreSinonStub(assignmentsApi.unlock)
    })

    describe('onFulFilAssignment', () => {
        beforeEach(() => {
            store.initialState.modal = {
                modalType: 'FULFIL_ASSIGNMENT',
                modalProps: {
                    $scope: {
                        reject: sinon.spy(),
                        resolve: sinon.spy(),
                    },
                    newsItem: { _id: 'item1' },
                },
            }
            store.initialState.workspace.currentWorkspace = 'AUTHORING'
        })

        it('call succeeds', (done) => {
            store.test(done, assignmentsUi.onFulFilAssignment({ _id: 'as1' }))
            .then(() => {
                expect(assignmentsApi.link.callCount).toBe(1)
                expect(assignmentsApi.link.args[0]).toEqual([{ _id: 'as1' }, { _id: 'item1' }])
                expect(services.notify.success.callCount).toBe(1)
                done()
            })
        })

        it('call fails', (done) => {
            restoreSinonStub(assignmentsApi.link)
            sinon.stub(assignmentsApi, 'link').callsFake(() => (Promise.reject(errorMessage)))
            store.test(done, assignmentsUi.onFulFilAssignment({ _id: 'as1' }))
            .then(() => {}, (error) => {
                expect(assignmentsApi.link.callCount).toBe(1)
                expect(assignmentsApi.link.args[0]).toEqual([{ _id: 'as1' }, { _id: 'item1' }])
                expect(error).toEqual(errorMessage)
                expect(services.notify.success.callCount).toBe(0)
                expect(services.notify.error.callCount).toBe(1)
                done()
            })
        })
    })
})
