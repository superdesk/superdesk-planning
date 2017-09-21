import { formatAddress } from '../utils'
import { get } from 'lodash'
import { LOCATIONS } from '../constants'

export function saveNominatim(nominatim) {
    return (dispatch, getState, { api }) => {
        const { address } = formatAddress(nominatim)
        return api('locations').save({}, {
            unique_name: nominatim.display_name,
            name: nominatim.namedetails.name,
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
    return (dispatch) => {
        const uniqueName = get(newLocation, 'nominatim.display_name')
            || get(newLocation, 'name')
            || newLocation
        // Check if the newLocation is already saved in internal
        // locations resources, if so just return the name and guid as qcode
        return dispatch(getLocation(uniqueName, true))
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
        .then(data => {
            const eventData = {
                name: data.name,
                qcode: data.guid,
            }

            if (data.position) {
                eventData.location = {
                    lat: data.position.latitude,
                    lon: data.position.longitude,
                }
            }

            if (get(data, 'address.external.nominatim.address')) {
                eventData.address = data.address.external.nominatim.address
            }

            return eventData
        })
    }
}

export const getLocation = (searchText, unique=false) => (
    (dispatch, getState, { api }) => {
        if (unique) {
            return api('locations').query(
                { source: { query: { term: { uniqueName: searchText } } } })
        } else {
            const s = 'name:*' + searchText + '*'
            return api('locations')
                .query({ source: { query: { bool: { must: [{ query_string: { query: s } }] } } } })
        }
    }
)

export const searchLocation = (searchText) => (
    (dispatch) => (
        dispatch(getLocation(searchText)).then(data => (
            dispatch({
                type: LOCATIONS.ACTIONS.SET_LOCATION_SEARCH_RESULTS,
                payload: data._items,
            })
        ))
    )
)
