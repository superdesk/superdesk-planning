import * as actions from '../actions'
import sinon from 'sinon'
import { registerNotifications } from './PlanningController'

describe('PlanningController', () => {
    describe('websocket', () => {
        const store = { dispatch: sinon.spy(() => Promise.resolve()) }
        const args = {
            item: 'foo',
            user: 'bar',
        }

        it('executes callback on notification', inject(($rootScope) => {
            actions.notifications['test:event'] = sinon.spy()
            registerNotifications($rootScope, store)
            $rootScope.$broadcast('test:event', args)
            expect(actions.notifications['test:event'].callCount).toBe(1)
            expect(actions.notifications['test:event'].args[0][1]).toEqual(args)
        }))

    })
})
