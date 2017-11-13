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
        sinon.stub(assignmentsApi, 'query').callsFake(() => (Promise.resolve({ _items: [] })))
    })

    afterEach(() => {
        restoreSinonStub(assignmentsApi.link)
        restoreSinonStub(assignmentsApi.lock)
        restoreSinonStub(assignmentsApi.unlock)
        restoreSinonStub(assignmentsApi.query)
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

    describe('assignment list actions', () => {
        it('queryAndSetAssignmentListGroups will appply filter to the query', (done) => {
            store.test(done, assignmentsUi.queryAndSetAssignmentListGroups(['in_progress']))
            .then(() => {
                expect(assignmentsApi.query.callCount).toBe(1)
                expect(assignmentsApi.query.args[0][0].states).toEqual(['in_progress'])
                done()
            })
        })

        it('queryAndSetAssignmentListGroups will use default page as 1 in query', (done) => {
            store.test(done, assignmentsUi.queryAndSetAssignmentListGroups(['in_progress']))
            .then(() => {
                expect(assignmentsApi.query.callCount).toBe(1)
                expect(assignmentsApi.query.args[0][0].page).toEqual(1)
                done()
            })
        })

        it('reloadAssignments will query all list groups if not state filter is passed', (done) => {
            store.test(done, assignmentsUi.reloadAssignments())
            .then(() => {
                expect(assignmentsApi.query.callCount).toBe(3)
                done()
            })
        })

        it('loadMoreAssignments will increment page number', (done) => {
            store.test(done, assignmentsUi.loadMoreAssignments(['in_progress']))
            .then(() => {
                expect(assignmentsApi.query.callCount).toBe(1)
                expect(assignmentsApi.query.args[0][0].page).toEqual(2)
                done()
            })
        })
    })
})
