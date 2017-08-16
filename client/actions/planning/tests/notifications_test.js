import planningApi from '../api'
import planningUi from '../ui'
import sinon from 'sinon'
import { registerNotifications } from '../../../utils'
import planningNotifications from '../notifications'
import { getTestActionStore, restoreSinonStub } from '../../../utils/testUtils'

describe('actions.planning.notifications', () => {
    let store
    let services
    let data

    const errorMessage = { data: { _message: 'Failed!' } }

    beforeEach(() => {
        store = getTestActionStore()
        services = store.services
        data = store.data
        store.init()
    })

    describe('websocket', () => {
        const delay = 250
        let $rootScope

        beforeEach(inject((_$rootScope_) => {
            sinon.stub(planningNotifications, 'onPlanningCreated').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(planningNotifications, 'onCoverageCreatedOrUpdated').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(planningNotifications, 'onCoverageDeleted').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(planningNotifications, 'onPlanningUpdated').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(planningNotifications, 'onPlanningUnlocked').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(planningNotifications, 'onPlanningPublished').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(planningNotifications, 'onPlanningSpiked').callsFake(
                () => (Promise.resolve())
            )

            $rootScope = _$rootScope_
            registerNotifications($rootScope, store)
            $rootScope.$digest()
        }))

        afterEach(() => {
            restoreSinonStub(planningNotifications.onPlanningCreated)
            restoreSinonStub(planningNotifications.onCoverageCreatedOrUpdated)
            restoreSinonStub(planningNotifications.onCoverageDeleted)
            restoreSinonStub(planningNotifications.onPlanningUpdated)
            restoreSinonStub(planningNotifications.onPlanningUnlocked)
            restoreSinonStub(planningNotifications.onPlanningPublished)
            restoreSinonStub(planningNotifications.onPlanningSpiked)
        })

        it('`planning:created` calls onPlanningCreated', (done) => {
            $rootScope.$broadcast('planning:created', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onPlanningCreated.callCount).toBe(1)
                expect(planningNotifications.onPlanningCreated.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`coverage:created` calls onCoverageCreatedOrUpdated', (done) => {
            $rootScope.$broadcast('coverage:created', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onCoverageCreatedOrUpdated.callCount).toBe(1)
                expect(planningNotifications.onCoverageCreatedOrUpdated.args[0][1])
                .toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`coverage:updated` calls onCoverageCreatedOrUpdated', (done) => {
            $rootScope.$broadcast('coverage:updated', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onCoverageCreatedOrUpdated.callCount).toBe(1)
                expect(planningNotifications.onCoverageCreatedOrUpdated.args[0][1])
                .toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`coverage:deleted` calls onCoverageDeleted', (done) => {
            $rootScope.$broadcast('coverage:deleted', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onCoverageDeleted.callCount).toBe(1)
                expect(planningNotifications.onCoverageDeleted.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`planning:updated` calls onPlanningUpdated', (done) => {
            $rootScope.$broadcast('planning:updated', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onPlanningUpdated.callCount).toBe(1)
                expect(planningNotifications.onPlanningUpdated.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`planning:spiked` calls onPlanningSpiked', (done) => {
            $rootScope.$broadcast('planning:spiked', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onPlanningSpiked.callCount).toBe(1)
                expect(planningNotifications.onPlanningSpiked.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`planning:unspiked` calls onPlanningUpdated', (done) => {
            $rootScope.$broadcast('planning:unspiked', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onPlanningUpdated.callCount).toBe(1)
                expect(planningNotifications.onPlanningUpdated.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`planning:lock` calls onPlanningUpdated', (done) => {
            $rootScope.$broadcast('planning:lock', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onPlanningUpdated.callCount).toBe(1)
                expect(planningNotifications.onPlanningUpdated.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`planning:unlock` calls onPlanningUnlocked', (done) => {
            $rootScope.$broadcast('planning:unlock', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onPlanningUnlocked.callCount).toBe(1)
                expect(planningNotifications.onPlanningUnlocked.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`planning:published` calls onPlanningPublished', (done) => {
            $rootScope.$broadcast('planning:published', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onPlanningPublished.callCount).toBe(1)
                expect(planningNotifications.onPlanningPublished.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })

        it('`planning:duplicated` calls onPlanningCreated', (done) => {
            $rootScope.$broadcast('planning:duplicated', { item: 'p2' })

            setTimeout(() => {
                expect(planningNotifications.onPlanningCreated.callCount).toBe(1)
                expect(planningNotifications.onPlanningCreated.args[0][1]).toEqual({ item: 'p2' })

                done()
            }, delay)
        })
    })

    describe('`planning:created`', () => {
        afterEach(() => {
            restoreSinonStub(planningApi.refetch)
            restoreSinonStub(planningUi.setInList)
            restoreSinonStub(planningNotifications.canRefetchPlanning)
        })

        it('calls refetch on create', (done) => {
            restoreSinonStub(planningApi.refetch)
            sinon.stub(planningApi, 'refetch').callsFake(() => (Promise.resolve([{ _id: 'p1' }])))
            sinon.stub(planningUi, 'setInList').callsFake(() => ({ type: 'setInList' }))
            sinon.stub(planningNotifications, 'canRefetchPlanning').callsFake(
                () => (Promise.resolve(true))
            )

            return store.test(done, planningNotifications.onPlanningCreated({}, { item: 'p1' }))
            .then(() => {
                expect(planningNotifications.canRefetchPlanning.callCount).toBe(1)
                expect(planningApi.refetch.callCount).toBe(1)
                expect(planningUi.setInList.callCount).toBe(1)
                done()
            })
        })

        it('notifies user if refetch failed', (done) => {
            restoreSinonStub(planningApi.refetch)
            sinon.stub(planningApi, 'refetch').callsFake(
                () => (Promise.reject(errorMessage))
            )
            sinon.stub(planningNotifications, 'canRefetchPlanning').callsFake(
                () => (Promise.resolve(true))
            )

            return store.test(done, planningNotifications.onPlanningCreated({}, { item: 'p5' }))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])
                done()
            })
        })
    })

    describe('`canRefetchPlanning`', () => {
        it('user is editing in the same session', (done) => {
            store.initialState.session = {
                identity: { _id: 'foo' },
                sessionId: 'bar',
            }
            return store.test(done, planningNotifications.canRefetchPlanning({
                item: 'p1',
                added_agendas: ['a1'],
                removed_agendas: ['a2'],
                user: 'foo',
                session: 'bar',
            }))
            .then((result) => {
                expect(result).toBe(false)
                done()
            })
        })

        it('user is editing not in the same session', (done) => {
            store.initialState.agenda.currentAgendaId = 'a1'
            store.initialState.session = {
                identity: { _id: 'foo' },
                sessionId: 'bar2',
            }
            return store.test(done, planningNotifications.canRefetchPlanning({
                item: 'p1',
                added_agendas: ['a1'],
                removed_agendas: ['a2'],
                user: 'foo',
                session: 'bar',
            }))
            .then((result) => {
                expect(result).toBe(true)
                done()
            })
        })

        it('current agenda is same as planning item agenda', (done) => {
            store.initialState.agenda.currentAgendaId = 'a1'
            store.initialState.session = {
                identity: { _id: 'foo' },
                sessionId: 'bar2',
            }
            return store.test(done, planningNotifications.canRefetchPlanning({
                item: 'p1',
                added_agendas: ['a1'],
                removed_agendas: ['a2'],
                user: 'foo',
                session: 'bar',
            }))
            .then((result) => {
                expect(result).toBe(true)
                done()
            })
        })

        it('current agenda is not same as planning item agenda', (done) => {
            store.initialState.agenda.currentAgendaId = 'a3'
            store.initialState.session = {
                identity: { _id: 'foo' },
                sessionId: 'bar2',
            }
            return store.test(done, planningNotifications.canRefetchPlanning({
                item: 'p1',
                added_agendas: ['a1'],
                removed_agendas: ['a2'],
                user: 'foo',
                session: 'bar',
            }))
            .then((result) => {
                expect(result).toBe(false)
                done()
            })
        })

        it('planning item is removed from the agenda', (done) => {
            store.initialState.agenda.currentAgendaId = 'a2'
            store.initialState.session = {
                identity: { _id: 'foo' },
                sessionId: 'bar2',
            }
            return store.test(done, planningNotifications.canRefetchPlanning({
                item: 'p1',
                added_agendas: ['a1'],
                removed_agendas: ['a2'],
                user: 'foo',
                session: 'bar',
            }))
            .then((result) => {
                expect(result).toBe(true)
                done()
            })
        })
    })

    describe('onCoverageCreatedOrUpdated', () => {
        afterEach(() => {
            restoreSinonStub(planningApi.fetchCoverageById)
        })

        it('calls fetchCoverageById', (done) => {
            sinon.stub(planningApi, 'fetchCoverageById').callsFake(
                () => (Promise.resolve(data.coverages[1]))
            )

            return store.test(done, planningNotifications.onCoverageCreatedOrUpdated(
                {},
                {
                    item: 'c2',
                    planning: 'p1',
                }
            ))
            .then((item) => {
                expect(item).toEqual(data.coverages[1])
                expect(planningApi.fetchCoverageById.callCount).toBe(1)
                expect(planningApi.fetchCoverageById.args[0]).toEqual(['c2', true])
                done()
            })
        })

        it('notifies user if fetchCoverageById failed', (done) => {
            sinon.stub(planningApi, 'fetchCoverageById').callsFake(
                () => (Promise.reject(errorMessage))
            )

            return store.test(done, planningNotifications.onCoverageCreatedOrUpdated(
                {},
                {
                    item: 'c1',
                    planning: 'p1',
                }
            ))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])
                done()
            })
        })
    })

    it('onCoverageDeleted', (done) => (
        store.test(done, planningNotifications.onCoverageDeleted(
            {},
            {
                item: 'c2',
                planning: 'p1',
            }
        ))
        .then(() => {
            expect(store.dispatch.args[0]).toEqual([{
                type: 'COVERAGE_DELETED',
                payload: {
                    _id: 'c2',
                    planning_item: 'p1',
                },
            }])
            done()
        })
    ))

    describe('onPlanningUpdated', () => {
        afterEach(() => {
            restoreSinonStub(planningApi.loadPlanningById)
            restoreSinonStub(planningApi.refetch)
            restoreSinonStub(planningUi.setInList)
            restoreSinonStub(planningUi.refetch)
            restoreSinonStub(planningNotifications.canRefetchPlanning)
        })

        it('calls loadPlanningById on update', (done) => {
            sinon.stub(planningApi, 'loadPlanningById').callsFake(
                () => (Promise.resolve(data.plannings[0]))
            )

            return store.test(done, planningNotifications.onPlanningUpdated(
                {},
                { item: 'p1' },
                false
            ))
            .then((item) => {
                expect(item).toEqual(data.plannings[0])
                expect(planningApi.loadPlanningById.callCount).toBe(1)
                expect(planningApi.loadPlanningById.args[0]).toEqual(['p1', true])

                done()
            })
        })

        it('notifies user is fetchPlanningById fails', (done) => {
            sinon.stub(planningApi, 'loadPlanningById').callsFake(
                () => (Promise.reject(errorMessage))
            )

            return store.test(done, planningNotifications.onPlanningUpdated(
                {},
                { item: 'p1' },
                false
            ))
            .then(() => {}, (error) => {
                expect(error).toEqual(errorMessage)
                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0]).toEqual(['Failed!'])

                done()
            })
        })

        it('calls refetch on update', (done) => {
            sinon.stub(planningApi, 'loadPlanningById').callsFake(
                () => (Promise.resolve(data.plannings[0]))
            )

            sinon.stub(planningUi, 'refetch').callsFake(() => (Promise.resolve()))
            sinon.stub(planningNotifications, 'canRefetchPlanning').callsFake(
                () => (Promise.resolve(true))
            )

            return store.test(done, planningNotifications.onPlanningUpdated(
                {},
                { item: 'p1' },
                true
            ))
            .then(() => {
                expect(planningNotifications.canRefetchPlanning.callCount).toBe(1)
                expect(planningUi.refetch.callCount).toBe(1)
                expect(planningApi.loadPlanningById.callCount).toBe(0)
                done()
            })
        })
    })

    describe('`planning:unlocked`', () => {
        beforeEach(() => {
            store.initialState.planning.currentPlanningId = 'p1'
            store.initialState.planning.plannings.p1.lock_user = 'ident1'
            store.initialState.planning.plannings.p1.lock_session = 'session1'
            store.ready = true
        })

        it('dispatches notification modal if item unlocked is being edited', (done) => (
            store.test(done, planningNotifications.onPlanningUnlocked({},
                {
                    item: 'p1',
                    user: 'ident2',
                }))
            .then(() => {
                const modalStr = 'The planning item you were editing was unlocked' +
                    ' by \"firstname2 lastname2\"'
                expect(store.dispatch.args[0]).toEqual([{
                    type: 'SHOW_MODAL',
                    modalType: 'NOTIFICATION_MODAL',
                    modalProps: {
                        title: 'Item Unlocked',
                        body: modalStr,
                    },
                }])

                done()
            })
        ))

        it('dispatches receivePlannings', (done) => (
            store.test(done, planningNotifications.onPlanningUnlocked({},
                {
                    item: 'p1',
                    user: 'ident2',
                })) .then(() => {
                    expect(store.dispatch.args[1]).toEqual([{
                        type: 'RECEIVE_PLANNINGS',
                        payload: [{
                            ...data.plannings[0],
                            lock_action: null,
                            lock_user: null,
                            lock_session: null,
                            lock_time: null,
                            _etag: undefined,
                        }],
                    }])

                    done()
                })
        ))
    })

    describe('onPlanningPublished', () => {
        afterEach(() => {
            restoreSinonStub(planningUi.refetch)
        })

        it('onPlanningPublished calls fetchToList', (done) => {
            sinon.stub(planningUi, 'refetch').callsFake(() => (Promise.resolve()))

            store.test(done, planningNotifications.onPlanningPublished({}, { item: 'p1' }))
            .then(() => {
                // Reloads selected Agenda Plannings
                expect(planningUi.refetch.callCount).toBe(1)
                done()
            })
        })
    })
})
