import { receiveEvents } from './events'

function _searchEvents({ form }) {
    return (dispatch, getState, { api }) => {
        const query = {}
        const range = {}
        const filter = {}
        const should = []

        if (form.name) {
            should.push(
                { match: { name: form.name } },
                { match: { definition_short: form.name } }
            )
        }

        if (form.location) {
            should.push(
                { match: { 'location.name': form.location } },
                { match: { 'location.qcode': form.location } }
            )
        }

        if (form.dates) {
            if (form.dates.start) {
                range['dates.start'] = { gte: form.dates.start }
            }

            if (form.dates.end) {
                range['dates.end'] = { lte: form.dates.end }
            }

            filter.range = range
        }

        // build the query
        if (should.length > 0) {
            query.bool = { should: should }
        }

        if (filter.length > 0) {
            query.filter = filter
        }

        // Query the API and sort by date
        return api('events').query({
            sort: '[("dates.start",1)]',
            embedded: { files: 1 },
            source: JSON.stringify({ query, filter })
        })
    }
}

export function searchEvents({ form }) {
    return (dispatch, getState, { $timeout, $location }) => {
        dispatch({ type: 'REQUEST_EVENTS', payload: form })
        dispatch(_searchEvents({ form }))
        .then(data => dispatch(receiveEvents(data._items)))
        // update the url (deep linking)
        .then(() => $timeout(() => ($location.search('advancedSearchEvent', form))))
    }
}
