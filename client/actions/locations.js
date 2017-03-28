import { formatAddress } from '../utils'
import { get } from 'lodash'

export function saveNominatim(nominatim) {
    return (dispatch, getState, { api }) => {
        const { shortName, address } = formatAddress(nominatim)
        return api('locations').save({}, {
            unique_name: nominatim.display_name,
            name: shortName,
            address: address,
            position: {
                latitude: nominatim.lat,
                longitude: nominatim.lon,
            },
        })
    }
}

export function saveFreeTextLocation(location) {
    return (dispatch, getState, { api }) => (
        api('locations').save({}, {
            unique_name: location,
            name: location,
        })
    )
}

export function saveLocation(newLocation) {
    return (dispatch, getState, { api }) => {
        const uniqueName = get(newLocation, 'nominatim.display_name')
            || get(newLocation, 'name')
            || newLocation
        // Check if the newLocation is already saved in internal
        // locations resources, if so just return the name and guid as qcode
        return api('locations').query({ source: { query: { term: { unique_name: uniqueName } } } })
        .then(data => {
            if (data._items.length) {
                // we have this location stored already
                return data._items[0]
            } else {
                // this is a new location
                if (newLocation.nominatim) {
                    return dispatch(saveNominatim(newLocation.nominatim))
                } else {
                    return dispatch(saveFreeTextLocation(uniqueName))
                }
            }
        })
        .then(data => ({
            name: data.name,
            qcode: data.guid,
        }))
    }
}
