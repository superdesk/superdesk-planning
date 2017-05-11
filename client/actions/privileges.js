import { PRIVILEGES } from '../constants'

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

export {
    loadPrivileges,
}
