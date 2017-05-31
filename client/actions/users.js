/**
 * Action dispatcher to load the list of users in Superdesk.
 * The data is fetched using the angular service `superdesk.apps.users.userListService`
 * @return arrow function
 */
const loadUsers = () => (
    (dispatch, getState, { userList }) => (
        userList.getAll().then((result) => (
            dispatch({
                type: 'RECEIVE_USERS',
                payload: result,
            })
        ))
    )
)

export {
    loadUsers,
}
