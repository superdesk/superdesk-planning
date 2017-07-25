/**
 * Action dispatcher to load the list of users in Superdesk.
 * The data is fetched using the angular service `superdesk.apps.users.userListService`
 * @return arrow function
 */
const loadUrgency = () => (
    (dispatch, getState, { metadata, gettextCatalog }) => (
        metadata.initialize().then(() => {
            dispatch({
                type: 'RECEIVE_URGENCY',
                payload: {
                    urgency: metadata.values.urgency,
                    label: gettextCatalog.getString('Urgency'),
                },
            })
        })
    )
)

export {
    loadUrgency,
}
