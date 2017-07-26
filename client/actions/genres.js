/**
 * Action dispatcher to load the list of users in Superdesk.
 * The data is fetched using the angular service `superdesk.apps.users.userListService`
 * @return arrow function
 */
const loadGenres = () => (
    (dispatch, getState, { metadata }) => (
        metadata.initialize().then(() => {
            dispatch({
                type: 'RECEIVE_GENRES',
                payload: metadata.values.genre,
            })
        })
    )
)

export {
    loadGenres,
}
