import sinon from 'sinon'
import { registerNotifications } from '../../../utils'
import eventsNotifications from '../notifications'
import { getTestActionStore, restoreSinonStub } from '../../../utils/testUtils'

describe('actions.events.notifications', () => {
    let store

    beforeEach(() => {
        store = getTestActionStore()
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

            $rootScope = _$rootScope_
            registerNotifications($rootScope, store)
            $rootScope.$digest()
        }))

        afterEach(() => {
            restoreSinonStub(eventsNotifications.onEventLocked)
            restoreSinonStub(eventsNotifications.onEventUnlocked)
            restoreSinonStub(eventsNotifications.onEventSpiked)
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
    })
})
