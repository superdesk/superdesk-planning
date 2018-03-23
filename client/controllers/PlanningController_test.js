import * as actions from '../actions';
import sinon from 'sinon';
import {registerNotifications} from '../utils';

describe('PlanningController', () => {
    describe('websocket', () => {
        const store = {dispatch: sinon.spy(() => Promise.resolve())};
        const args = {
            item: 'foo',
            user: 'bar',
        };

        it('executes callback on notification', inject(($rootScope) => {
            const event = sinon.spy();

            actions.notifications['test:event'] = () => (event);
            registerNotifications($rootScope, store);
            $rootScope.$broadcast('test:event', args);
            expect(event.callCount).toBe(1);
            expect(event.args[0][1]).toEqual(args);
        }));
    });
});
