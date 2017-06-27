/**
 * Action dispatcher to load the session details of the logged user in Superdesk.
 * @return arrow function
 */
const loadSessionDetails = () => (
    (dispatch, getState, { session }) => (
        dispatch({
            type: 'LOAD_SESSION_DETAILS',
            payload: {
                // We don't want all properties and functions session object exposes
                // For safety reasons, fuctions like clearSession() shouldn't be exposed
                sessionId: session.sessionId,
                identity: session.identity,
            },
        })
    )
)

export {
    loadSessionDetails,
}
