import eventsApi from '../api'
import sinon from 'sinon'
import { registerNotifications } from '../../../utils'
import eventsNotifications from '../notifications'
import { getTestActionStore, restoreSinonStub } from '../../../utils/testUtils'
import moment from 'moment'

describe('actions.events.notifications', () => {
    let store
    let data

    beforeEach(() => {
        store = getTestActionStore()
        data = store.data
        store.init()
    })

    describe('websocket', () => {
        const delay = 250
        let $rootScope

        beforeEach(inject((_$rootScope_) => {
            sinon.stub(eventsNotifications, 'onEventLocked').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(eventsNotifications, 'onEventUnlocked').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(eventsNotifications, 'onEventSpiked').callsFake(
                () => (Promise.resolve())
            )
            sinon.stub(eventsNotifications, 'onEventUnspiked').callsFake(
                () => (Promise.resolve())
            )

            sinon.stub(eventsNotifications, 'onEventRescheduled').callsFake(
                () => (Promise.resolve())
            )

            $rootScope = _$rootScope_
            registerNotifications($rootScope, store)
            $rootScope.$digest()
        }))

        afterEach(() => {
            restoreSinonStub(eventsNotifications.onEventLocked)
            restoreSinonStub(eventsNotifications.onEventUnlocked)
            restoreSinonStub(eventsNotifications.onEventSpiked)
            restoreSinonStub(eventsNotifications.onEventUnspiked)
            restoreSinonStub(eventsNotifications.onEventRescheduled)
        })

        it('`events:lock` calls onEventLocked', (done) => {
            $rootScope.$broadcast('events:lock', { item: 'e1' })

            setTimeout(() => {
                expect(eventsNotifications.onEventLocked.callCount).toBe(1)
                expect(eventsNotifications.onEventLocked.args[0][1]).toEqual({ item: 'e1' })

                done()
            }, delay)
        })

        it('`events:unlock` calls onEventUnlocked', (done) => {
            $rootScope.$broadcast('events:unlock', { item: 'e1' })

            setTimeout(() => {
                expect(eventsNotifications.onEventUnlocked.callCount).toBe(1)
                expect(eventsNotifications.onEventUnlocked.args[0][1]).toEqual({ item: 'e1' })

                done()
            }, delay)
        })

        it('`events:spiked` calls onEventSpiked', (done) => {
            $rootScope.$broadcast('events:spiked', { item: 'e1' })

            setTimeout(() => {
                expect(eventsNotifications.onEventSpiked.callCount).toBe(1)
                expect(eventsNotifications.onEventSpiked.args[0][1]).toEqual({ item: 'e1' })

                done()
            }, delay)
        })

        it('`events:unspiked` calls onEventUnspiked', (done) => {
            $rootScope.$broadcast('events:unspiked', { item: 'e1' })

            setTimeout(() => {
                expect(eventsNotifications.onEventUnspiked.callCount).toBe(1)
                expect(eventsNotifications.onEventUnspiked.args[0][1]).toEqual({ item: 'e1' })

                done()
            }, delay)
        })

        it('`events:rescheduled` calls onEventRescheduled', (done) => {
            $rootScope.$broadcast('events:rescheduled', { item: 'e1' })

            setTimeout(() => {
                expect(eventsNotifications.onEventRescheduled.callCount).toBe(1)
                expect(eventsNotifications.onEventRescheduled.args[0][1]).toEqual({ item: 'e1' })

                done()
            }, delay)
        })
    })

    describe('onEventLocked', () => {
        beforeEach(() => {
            sinon.stub(eventsApi, 'getEvent').returns(Promise.resolve(data.events[0]))
        })

        afterEach(() => {
            restoreSinonStub(eventsApi.getEvent)
        })

        it('calls getEvent and dispatches the LOCK_EVENT action', (done) => (
            store.test(done, eventsNotifications.onEventLocked(
                {},
                {
                    item: 'e1',
                    lock_action: 'edit',
                    lock_session: 'sess123',
                    lock_time: '2099-10-15T14:30+0000',
                    user: 'user456',
                    etag: 'e789',
                }
            ))
            .then(() => {
                expect(eventsApi.getEvent.callCount).toBe(1)
                expect(eventsApi.getEvent.args[0]).toEqual([
                    'e1',
                    false,
                ])
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'LOCK_EVENT',
                    payload: {
                        event: {
                            ...data.events[0],
                            lock_action: 'edit',
                            lock_user: 'user456',
                            lock_session: 'sess123',
                            lock_time: '2099-10-15T14:30+0000',
                            _etag: 'e789',
                        },
                    },
                }])

                done()
            })
        ))
    })

    describe('onEventUnlocked', () => {
        beforeEach(() => {
            store.initialState.events.showEventDetails = 'e1'
            store.initialState.events.events.e1.lock_user = 'ident1'
            store.initialState.events.events.e1.lock_session = 'session1'
        })

        it('dispatches notification modal if the Event unlocked is being edited', (done) => (
            store.test(done, eventsNotifications.onEventUnlocked(
                {},
                {
                    item: 'e1',
                    user: 'ident2',
                }
            ))
            .then(() => {
                const modalStr = 'The event you were editing was unlocked' +
                    ' by "firstname2 lastname2"'
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

        it('dispatches `UNLOCK_EVENT` action', (done) => (
            store.test(done, eventsNotifications.onEventUnlocked(
                {},
                {
                    item: 'e1',
                    user: 'ident2',
                    etag: 'e123',
                }
            ))
            .then(() => {
                expect(store.dispatch.args[1]).toEqual([{
                    type: 'UNLOCK_EVENT',
                    payload: {
                        event: {
                            ...data.events[0],
                            dates: {
                                ...data.events[0].dates,
                                start: moment(data.events[0].dates.start),
                                end: moment(data.events[0].dates.end),
                            },
                            lock_action: null,
                            lock_user: null,
                            lock_session: null,
                            lock_time: null,
                            _etag: 'e123',
                        },
                    },
                }])

                done()
            })
        ))
    })

    it('onEventSpiked dispatches `SPIKE_EVENT` action', (done) => {
        restoreSinonStub(eventsNotifications.onEventSpiked)
        store.test(done, eventsNotifications.onEventSpiked({}, {
            item: data.events[0]._id,
            revert_state: 'draft',
            etag: 'e123',
        }))
        .then(() => {
            expect(store.dispatch.args[0]).toEqual([{
                type: 'SPIKE_EVENT',
                payload: {
                    event: {
                        ...store.initialState.events.events.e1,
                        lock_action: null,
                        lock_user: null,
                        lock_session: null,
                        lock_time: null,
                        state: 'spiked',
                        revert_state: 'draft',
                        _etag: 'e123',
                    },
                },
            }])

            done()
        })
    })

    it('onEventUnspiked dispatches `UNSPIKE_EVENT` action', (done) => {
        restoreSinonStub(eventsNotifications.onEventUnspiked)
        store.test(done, eventsNotifications.onEventUnspiked({}, {
            item: data.events[0]._id,
            state: 'draft',
            etag: 'e456',
        }))
        .then(() => {
            expect(store.dispatch.args[0]).toEqual([{
                type: 'UNSPIKE_EVENT',
                payload: {
                    event: {
                        ...store.initialState.events.events.e1,
                        lock_action: null,
                        lock_user: null,
                        lock_session: null,
                        lock_time: null,
                        state: 'draft',
                        revert_state: null,
                        _etag: 'e456',
                    },
                },
            }])

            done()
        })
    })
})
