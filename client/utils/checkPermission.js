import { PRIVILEGES } from '../constants'
import { getPrivileges } from '../selectors'

/**
 * Action wrapper for checking the supplied permission with the
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
const checkPermission = (action, permission, errorMessage) => (
    (...args) => (
        (dispatch, getState, { $timeout, notify }) => {
            const privileges = getPrivileges(getState())
            if (permission in privileges && privileges[permission] === 1) {
                return Promise.resolve(dispatch(action(...args)))
            }

            $timeout(() => (notify.error(errorMessage)))
            return Promise.resolve(dispatch({
                type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                payload: {
                    action: action.name,
                    permission,
                    errorMessage,
                    args,
                },
            }))
        }
    )
)

export default checkPermission
