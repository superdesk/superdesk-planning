
export function loadIngestProviders() {
    return (dispatch, getState, { api }) => api('ingest_providers').query({
        max_results: 200,
        page: 1,
    }).then((results) => {
        dispatch({
            type: 'RECEIVE_INGEST_PROVIDERS',
            payload: results._items,
        })
    })
}
