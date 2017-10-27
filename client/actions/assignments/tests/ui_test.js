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
        it('call succeeds', (done) => {
            store.test(done, assignmentsUi.onFulFilAssignment({ _id: 'as1' }, { _id: 'item1' }))
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
            store.test(done, assignmentsUi.onFulFilAssignment({ _id: 'as1' }, { _id: 'item1' }))
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

    describe('openEditor', () => {
        it('calls lock endpoint and dispatches action to open editor', (done) => {
            store.test(done, assignmentsUi.openEditor(
                store.initialState.assignment.assignments['1']))
            .then(() => {
                expect(assignmentsApi.lock.callCount).toBe(1)
                expect(store.dispatch.args[2]).toEqual([{
                    type: 'OPEN_ASSIGNMENT_EDITOR',
                    payload: store.initialState.assignment.assignments['1'],
                }])
                done()
            })
        })
    })

    describe('closeEditor', () => {
        it('calls unlock endpoint dispatches action to close editor', (done) => {
            store.initialState.assignment.assignments['1'] = {
                ...store.initialState.assignment.assignments['1'],
                lock_user: 'ident1',
                lock_session: 'session1',
                lock_action: 'edit',
            }
            store.test(done, assignmentsUi.closeEditor(
                store.initialState.assignment.assignments['1']))
            .then(() => {
                expect(assignmentsApi.unlock.callCount).toBe(1)
                expect(store.dispatch.args[1]).toEqual([{ type: 'CLOSE_PREVIEW_ASSIGNMENT' }])
                done()
            })
        })

        it('does not cal unlock endpoint if lock action is content_edit', (done) => {
            store.initialState.assignment.assignments['1'] = {
                ...store.initialState.assignment.assignments['1'],
                lock_user: 'ident1',
                lock_session: 'session1',
                lock_action: 'content_edit',
            }
            store.test(done, assignmentsUi.closeEditor(
                store.initialState.assignment.assignments['1']))
            .then(() => {
                expect(assignmentsApi.unlock.callCount).toBe(0)
                done()
            })
        })
    })
})
