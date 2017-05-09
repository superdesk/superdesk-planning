import { PRIVILEGES } from '../constants'
import * as selectors from '../selectors'

/**
 * Action dispatcher to load the list of privileges for the current user.
 * The data is fetched using the angular service `superdesk.core.privileges`
 * @return arrow function
 */
const loadPrivileges = () => (
    (dispatch, getState, { privileges }) => (
        privileges.loaded.then(() => {
            dispatch({
                type: PRIVILEGES.ACTIONS.RECEIVE_PRIVILEGES,
                payload: privileges.privileges,
            })
        })
    )
)

/**
 * Action Dispatcher for checking the supplied permission with the
 * users privileges.
 * If the user has permission, then the action will be executed
 * Otherwise an ACCESS_DENIED action will be dispatched, and an
 * error notification will be shown to the user
 * @param {function} action - The function to execute on ACCESS_GRANTED
 * @param {string} permission - The specific privilege to check against
 * @param {string} errorMessage - The error message to display on ACCESS_DENIED
 * @param {object} args - Arguments to supply to the action on ACCESS_GRANTED
 * @return thunk function
 */
const checkPermission = (action, permission, errorMessage, args) => (
    (dispatch, getState, services) => {
        const { $timeout, notify } = services
        const privileges = selectors.getPrivileges(getState())

        if (permission in privileges && privileges[permission] === 1) {
            return action(dispatch, getState, services, args)
        }

        $timeout(() => (notify.error(errorMessage)))
        return dispatch({
            type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
            payload: {
                action: action.name,
                permission,
                errorMessage,
                args,
            },
        })
    }
)

export {
    loadPrivileges,
    checkPermission,
}
