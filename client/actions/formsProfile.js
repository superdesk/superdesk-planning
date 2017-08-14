/**
 * Action dispatcher to load the list of users in Superdesk.
 * The data is fetched using the angular service `superdesk.apps.users.userListService`
 * @return arrow function
 */
const loadFormsProfile = () => (
    (dispatch, getState, { api }) => api('planning_types').query({
        max_results: 200,
        page: 1,
    }).then((results) => {
        dispatch({
            type: 'RECEIVE_FORMS_PROFILE',
            payload: results._items,
        })
    })
)

export {
    loadFormsProfile,
}
