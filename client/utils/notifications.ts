import {WS_NOTIFICATION} from '../constants';
import * as actions from '../actions';
import {forEach} from 'lodash';

/**
 * Registers WebSocket Notifications to Redux Actions
 * @param {scope} $scope - PlanningController scope where notifications are received
 * @param {store} store - The Redux Store used for dispatching actions
 */
export const registerNotifications = ($scope, store) => {
    forEach(actions.notifications, (func, event) => {
        $scope.$on(event, (_e, data) => {
            store.dispatch({
                type: WS_NOTIFICATION,
                payload: {
                    event,
                    data,
                },
            });
            store.dispatch(func()(_e, data));
        });
    });
};

export default registerNotifications;
