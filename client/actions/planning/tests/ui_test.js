import planningUi from '../ui'
import planningApi from '../api'
import sinon from 'sinon'
import { PRIVILEGES } from '../../../constants'
import { getTestActionStore, restoreSinonStub, expectAccessDenied } from '../../../utils/testUtils'

describe('actions.planning.ui', () => {
    let store
    let services
    let data

    const errorMessage = { data: { _message: 'Failed!' } }

    beforeEach(() => {
        store = getTestActionStore()
        services = store.services
        data = store.data

        sinon.stub(planningApi, 'spike').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'unspike').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'fetch').callsFake(() => (Promise.resolve()))
        sinon.stub(planningApi, 'save').callsFake((item) => (Promise.resolve(item)))
        sinon.stub(planningApi, 'saveAndReloadCurrentAgenda').callsFake(
            (item) => (Promise.resolve(item))
        )
        sinon.stub(planningApi, 'lock').callsFake((item) => (Promise.resolve(item)))
        sinon.stub(planningApi, 'unlock').callsFake((item) => (Promise.resolve(item)))
        sinon.stub(planningUi, 'openEditor').callsFake(() => (Promise.resolve()))
        sinon.stub(planningUi, 'closeEditor').callsFake(() => (Promise.resolve()))
        sinon.stub(planningUi, 'preview').callsFake(() => (Promise.resolve()))
        sinon.stub(planningUi, 'requestPlannings').callsFake(() => (Promise.resolve()))

        sinon.stub(planningUi, 'clearList').callsFake(() => ({ type: 'clearList' }))
        sinon.stub(planningUi, 'setInList').callsFake(() => ({ type: 'setInList' }))
        sinon.stub(planningUi, 'addToList').callsFake(() => ({ type: 'addToList' }))
        sinon.stub(planningUi, 'fetchToList').callsFake(() => (Promise.resolve()))
        sinon.stub(planningUi, 'fetchMoreToList').callsFake(() => (Promise.resolve()))
    })

    afterEach(() => {
        restoreSinonStub(planningApi.spike)
        restoreSinonStub(planningApi.unspike)
        restoreSinonStub(planningApi.fetch)
        restoreSinonStub(planningApi.save)
        restoreSinonStub(planningApi.saveAndReloadCurrentAgenda)
        restoreSinonStub(planningApi.lock)
        restoreSinonStub(planningApi.unlock)

        restoreSinonStub(planningUi.openEditor)
        restoreSinonStub(planningUi.closeEditor)
        restoreSinonStub(planningUi.preview)
        restoreSinonStub(planningUi.requestPlannings)
        restoreSinonStub(planningUi.clearList)
        restoreSinonStub(planningUi.setInList)
        restoreSinonStub(planningUi.addToList)
        restoreSinonStub(planningUi.fetchToList)
        restoreSinonStub(planningUi.fetchMoreToList)
    })

    describe('spike', () => {
        it('ui.spike notifies end user on successful spike', (done) => (
            store.test(done, planningUi.spike(data.plannings[1]))
            .then((item) => {
                expect(item).toEqual(data.plannings[1])

                // Calls api.spike
                expect(planningApi.spike.callCount).toBe(1)
                expect(planningApi.spike.args[0]).toEqual([data.plannings[1]])

                // Doesn't close editor, as spiked item is not open
                expect(planningUi.closeEditor.callCount).toBe(0)

                // Notifies end user of success
                expect(services.notify.success.callCount).toBe(1)
                expect(services.notify.success.args[0]).toEqual([
                    'The Planning Item has been spiked.',
                ])

                expect(services.notify.error.callCount).toBe(0)

                done()
            })
        ))

        it('ui.spike closes editor if item is open', (done) => {
            store.initialState.planning.currentPlanningId = data.plannings[1]._id
            return store.test(done, planningUi.spike(data.plannings[1]))
            .then(() => {
                expect(planningUi.closeEditor.callCount).toBe(1)
                done()
            })
        })

        it('ui.spike notifies end user on failure to spike', (done) => {
            restoreSinonStub(planningApi.spike)
            sinon.stub(planningApi, 'spike').callsFake(() => (Promise.reject(errorMessage)))
            return store.test(done, planningUi.spike(data.plannings[1]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                // Notifies end user of failure
                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                expect(services.notify.success.callCount).toBe(0)
                done()
            })
        })

        it('ui.spike raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_planning_spike = 0
            return store.test(done, planningUi.spike(data.plannings[1]))
            .catch(() => {
                expectAccessDenied({
                    store,
                    permission: PRIVILEGES.SPIKE_PLANNING,
                    action: '_spike',
                    errorMessage: 'Unauthorised to spike a planning item!',
                    args: [data.plannings[1]],
                })
                done()
            })
        })
    })

    describe('unspike', () => {
        it('ui.unspike notifies end user on successful unspike', (done) => (
            store.test(done, planningUi.unspike(data.plannings[1]))
            .then((item) => {
                expect(item).toEqual(data.plannings[1])

                // Calls api.unspike
                expect(planningApi.unspike.callCount).toBe(1)
                expect(planningApi.unspike.args[0]).toEqual([data.plannings[1]])

                // Notified end user of success
                expect(services.notify.success.callCount).toBe(1)
                expect(services.notify.success.args[0]).toEqual([
                    'The Planning Item has been unspiked.',
                ])

                expect(services.notify.error.callCount).toBe(0)

                done()
            })
        ))

        it('ui.unspike notifies end user on failure to unspike', (done) => {
            restoreSinonStub(planningApi.unspike)
            sinon.stub(planningApi, 'unspike').callsFake(() => (Promise.reject(errorMessage)))
            return store.test(done, planningUi.unspike(data.plannings[1]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                // Notifies end user of failure
                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                expect(services.notify.success.callCount).toBe(0)
                done()
            })
        })

        it('ui.unspike raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_planning_unspike = 0
            return store.test(done, planningUi.unspike(data.plannings[1]))
            .catch(() => {
                expectAccessDenied({
                    store,
                    permission: PRIVILEGES.UNSPIKE_PLANNING,
                    action: '_unspike',
                    errorMessage: 'Unauthorised to unspike a planning item!',
                    args: [data.plannings[1]],
                })
                done()
            })
        })
    })

    describe('save', () => {
        it('saves and notifies end user', (done) => (
            store.test(done, planningUi.save(data.plannings[1]))
            .then((item) => {
                expect(item).toEqual(data.plannings[1])

                expect(planningApi.save.callCount).toBe(1)
                expect(planningApi.save.args[0]).toEqual([data.plannings[1]])

                expect(services.notify.success.callCount).toBe(1)
                expect(services.notify.success.args[0]).toEqual([
                    'The planning item has been saved.',
                ])

                done()
            })
        ))

        it('on fail notifies the end user', (done) => {
            restoreSinonStub(planningApi.save)
            sinon.stub(planningApi, 'save').callsFake(() => (Promise.reject(errorMessage)))
            return store.test(done, planningUi.save(data.plannings[1]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })

        it('save raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_planning_management = 0
            return store.test(done, planningUi.save(data.plannings[1]))
            .catch(() => {
                expectAccessDenied({
                    store,
                    permission: PRIVILEGES.PLANNING_MANAGEMENT,
                    action: '_save',
                    errorMessage: 'Unauthorised to create or modify a planning item!',
                    args: [data.plannings[1]],
                })
                done()
            })
        })
    })

    describe('saveAndReloadCurrentAgenda', () => {
        it('saves and reloads planning items', (done) => (
            store.test(done, planningUi.saveAndReloadCurrentAgenda(data.plannings[1]))
            .then((item) => {
                expect(item).toEqual(data.plannings[1])

                expect(planningApi.saveAndReloadCurrentAgenda.callCount).toBe(1)
                expect(planningApi.saveAndReloadCurrentAgenda.args[0]).toEqual([
                    data.plannings[1],
                ])

                expect(services.notify.success.callCount).toBe(1)
                expect(services.notify.success.args[0]).toEqual([
                    'The Planning item has been saved.',
                ])

                done()
            })
        ))

        it('on save fail notifies the end user', (done) => {
            restoreSinonStub(planningApi.saveAndReloadCurrentAgenda)
            sinon.stub(planningApi, 'saveAndReloadCurrentAgenda').callsFake(
                () => (Promise.reject(errorMessage))
            )

            return store.test(done, planningUi.saveAndReloadCurrentAgenda(data.plannings[1]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })

        it('saveAndReloadCurrentAgenda raises ACCESS_DENIED without permission', (done) => {
            store.initialState.privileges.planning_planning_management = 0
            return store.test(done, planningUi.saveAndReloadCurrentAgenda(data.plannings[1]))
            .catch(() => {
                expectAccessDenied({
                    store,
                    permission: PRIVILEGES.PLANNING_MANAGEMENT,
                    action: '_saveAndReloadCurrentAgenda',
                    errorMessage: 'Unauthorised to create or modify a planning item!',
                    args: [data.plannings[1]],
                })
                done()
            })
        })
    })

    it('preview', () => {
        store.initialState.planning.currentPlanningId = 'p1'
        restoreSinonStub(planningUi.preview)
        store.init()
        store.dispatch(planningUi.preview(data.plannings[1]._id))

        expect(store.dispatch.callCount).toBe(3)

        expect(planningUi.closeEditor.callCount).toBe(1)
        expect(planningUi.closeEditor.args[0]).toEqual([
            data.plannings[0],
        ])

        expect(store.dispatch.args[2]).toEqual([{
            type: 'PREVIEW_PLANNING',
            payload: 'p2',
        }])
    })

    it('closeEditor', () => {
        store.initialState.planning.currentPlanningId = 'p1'
        data.plannings[0].lock_user = store.initialState.session.identity._id
        data.plannings[0].lock_session = store.initialState.session.sessionId

        restoreSinonStub(planningUi.closeEditor)
        store.init()
        store.dispatch(planningUi.closeEditor(data.plannings[1]))

        expect(planningApi.unlock.callCount).toBe(1)
        expect(planningApi.unlock.args[0]).toEqual([data.plannings[1]])

        expect(store.dispatch.args[2]).toEqual([{ type: 'CLOSE_PLANNING_EDITOR' }])
    })

    describe('openEditor', () => {
        it('opens the editor', (done) => {
            store.initialState.planning.currentPlanningId = 'p1'
            restoreSinonStub(planningUi.openEditor)
            store.test(done, planningUi.openEditor(data.plannings[1]))
            .then((lockedItem) => {
                expect(lockedItem).toEqual(data.plannings[1])

                expect(planningUi.closeEditor.callCount).toBe(1)
                expect(planningUi.closeEditor.args[0]).toEqual([data.plannings[0]])

                expect(store.dispatch.args[3]).toEqual([{
                    type: 'OPEN_PLANNING_EDITOR',
                    payload: lockedItem,
                }])

                done()
            })
        })

        it('sends error notification if lock failed', (done) => {
            store.initialState.planning.currentPlanningId = 'p1'
            restoreSinonStub(planningUi.openEditor)
            restoreSinonStub(planningApi.lock)
            sinon.stub(planningApi, 'lock').callsFake(() => (Promise.reject(errorMessage)))
            store.test(done, planningUi.openEditor(data.plannings[1]))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)

                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })
    })

    it('previewPlanningAndOpenAgenda', () => {
        store.init()
        store.dispatch(planningUi.previewPlanningAndOpenAgenda(data.plannings[0]._id,
            data.agendas[1]))

        expect(store.dispatch.args[2]).toEqual([{
            type: 'SELECT_AGENDA',
            payload: 'a2',
        }])

        expect(services.$timeout.callCount).toBe(1)
        expect(services.$location.search.callCount).toBe(1)
        expect(services.$location.search.args[0]).toEqual(['agenda', 'a2'])

        expect(planningUi.preview.callCount).toBe(1)
        expect(planningUi.preview.args[0]).toEqual(['p1'])
    })

    it('toggleOnlyFutureFilter', (done) => {
        store.initialState.planning.onlyFuture = true
        store.dispatch(planningUi.toggleOnlyFutureFilter())
        .then(() => {
            store.initialState.planning.onlyFuture = false
            store.dispatch(planningUi.toggleOnlyFutureFilter())
            .then(() => {
                expect(store.dispatch.callCount).toBe(4)
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SET_ONLY_FUTURE',
                    payload: false,
                }])

                expect(store.dispatch.args[3]).toEqual([{
                    type: 'SET_ONLY_FUTURE',
                    payload: true,
                }])
                done()
            })
        })
    })

    it('filterByKeyword', () => {
        expect(planningUi.filterByKeyword('Plan')).toEqual({
            type: 'PLANNING_FILTER_BY_KEYWORD',
            payload: 'Plan',
        })
    })

    it('toggleOnlySpikedFilter', (done) => {
        store.initialState.planning.onlySpiked = false
        store.dispatch(planningUi.toggleOnlySpikedFilter())
        .then(() => {
            store.initialState.planning.onlySpiked = true
            store.dispatch(planningUi.toggleOnlySpikedFilter())
            .then(() => {
                expect(store.dispatch.callCount).toBe(4)
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'SET_ONLY_SPIKED',
                    payload: true,
                }])

                expect(store.dispatch.args[3]).toEqual([{
                    type: 'SET_ONLY_SPIKED',
                    payload: false,
                }])

                done()
            })
        })
    })

    it('clearList', () => {
        restoreSinonStub(planningUi.clearList)
        expect(planningUi.clearList()).toEqual({ type: 'CLEAR_PLANNING_LIST' })
    })

    it('setInList', () => {
        restoreSinonStub(planningUi.setInList)
        expect(planningUi.setInList(['p1', 'p2', 'p3'])).toEqual({
            type: 'SET_PLANNING_LIST',
            payload: ['p1', 'p2', 'p3'],
        })
    })

    it('addToList', () => {
        restoreSinonStub(planningUi.addToList)
        expect(planningUi.addToList(['p4', 'p5'])).toEqual({
            type: 'ADD_TO_PLANNING_LIST',
            payload: ['p4', 'p5'],
        })
    })

    it('fetchToList', (done) => {
        restoreSinonStub(planningUi.fetchToList)
        restoreSinonStub(planningApi.fetch)
        sinon.stub(planningApi, 'fetch').callsFake(
            () => (Promise.resolve(data.plannings))
        )

        const params = store.initialState.planning.lastRequestParams

        store.test(done, planningUi.fetchToList(params))
        .then(() => {
            expect(planningUi.requestPlannings.callCount).toBe(1)
            expect(planningUi.requestPlannings.args[0]).toEqual([params])

            expect(planningApi.fetch.callCount).toBe(1)
            expect(planningApi.fetch.args[0]).toEqual([params])

            expect(planningUi.setInList.callCount).toBe(1)
            expect(planningUi.setInList.args[0]).toEqual([['p1', 'p2']])

            done()
        })
    })

    it('fetchMoreToList', (done) => {
        restoreSinonStub(planningUi.fetchMoreToList)
        restoreSinonStub(planningApi.fetch)
        sinon.stub(planningApi, 'fetch').callsFake(
            () => (Promise.resolve(data.plannings))
        )

        const expectedParams = {
            agendas: ['a1'],
            noAgendaAssigned: false,
            page: 2,
        }

        store.test(done, planningUi.fetchMoreToList())
        .then(() => {
            expect(planningUi.requestPlannings.callCount).toBe(1)
            expect(planningUi.requestPlannings.args[0]).toEqual([expectedParams])

            expect(planningApi.fetch.callCount).toBe(1)
            expect(planningApi.fetch.args[0]).toEqual([expectedParams])

            expect(planningUi.addToList.callCount).toBe(1)
            expect(planningUi.addToList.args[0]).toEqual([['p1', 'p2']])

            done()
        })
    })

    it('requestPlannings', () => {
        restoreSinonStub(planningUi.requestPlannings)
        expect(planningUi.requestPlannings({ page: 2 })).toEqual({
            type: 'REQUEST_PLANNINGS',
            payload: { page: 2 },
        })
    })

})
