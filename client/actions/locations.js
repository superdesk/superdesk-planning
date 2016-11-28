export const saveNewLocation = (newLocation) => (
    (dispatch, getState, { api }) => {
        // Map location.nominatim fields to formattedLocation

        let address = {
            line: [ newLocation.nominatim.address.house_number
                + ' ' + newLocation.nominatim.address.road],
            locality: newLocation.nominatim.address.state,
            area: newLocation.nominatim.address.city_district
                + ', ' + newLocation.nominatim.address.suburb,
            country: newLocation.nominatim.address.country,
            postal_code: newLocation.nominatim.address.postal_code,
            external: {
                nominatim: newLocation.nominatim
            }
        }
        let formattedLocation = {
            name: newLocation.nominatim.display_name,
            address: address,
            position: {
                latitude: newLocation.nominatim.lat,
                longitude: newLocation.nominatim.lon
            }
        }

        return api('locations').save({}, formattedLocation)
    }
)
export const saveLocation = (newLocation) => (
    (dispatch, getState, { api }) => (
        // Check if the newLocation is already saved in internal
        // locations resources, if so just return the name and guid as qcode
        api('locations').query({
            source: { query: { term: { name: newLocation.nominatim.display_name } } }
        })
        .then(data => {
            if (data._items.length) {
                // we have this location stored already
                return { name: data._items[0].name, qcode: data._items[0].guid }
            } else {
                // this is a new location
                return dispatch(saveNewLocation(newLocation))
                .then(data => ({ name: data.name, qcode: data.guid }))
            }
        })
    )
)
