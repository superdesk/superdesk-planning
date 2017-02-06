export function saveNewLocation(newLocation) {
    return (dispatch, getState, { api }) => {
        // Map nominatim fields to NewsML locality
        let localityHierarchy = [
            'state',
            'state_district',
            'region',
            'county',
            'island',
            'town',
            'moor',
            'waterways',
            'village',
            'district',
            'borough'
        ]
        let localityField = localityHierarchy.find((locality) =>
            newLocation.nominatim.address.hasOwnProperty(locality)
        )
        // Map nominatim fields to NewsML area
        let areaHierarchy = [
            'island',
            'town',
            'moor',
            'waterways',
            'village',
            'hamlet',
            'municipality',
            'district',
            'borough',
            'airport',
            'national_park',
            'suburb',
            'croft',
            'subdivision',
            'farm',
            'locality',
            'islet'
        ]
        let areaField = areaHierarchy.find((area) =>
            newLocation.nominatim.address.hasOwnProperty(area)
        )
        let address = {
            line: [newLocation.nominatim.address.house_number
                + ' ' + newLocation.nominatim.address.road],
            locality: newLocation.nominatim.address[localityField],
            area: newLocation.nominatim.address[areaField],
            country: newLocation.nominatim.address.country,
            postal_code: newLocation.nominatim.address.postcode,
            external: {
                nominatim: newLocation.nominatim
            }
        }
        let shortName = (address.hasOwnProperty('line') ? address.line[0] : '')
            + (address.hasOwnProperty('locality') ? ', ' + address.locality : '')
            + (address.hasOwnProperty('postal_code') ? ', ' + address.postal_code : '')
            + (address.hasOwnProperty('country') ? ', ' + address.country : '')
        let formattedLocation = {
            unique_name: newLocation.nominatim.display_name,
            name: shortName,
            address: address,
            position: {
                latitude: newLocation.nominatim.lat,
                longitude: newLocation.nominatim.lon
            }
        }

        return api('locations').save({}, formattedLocation)
    }
}

export function saveLocation(newLocation) {
    return (dispatch, getState, { api }) => (
        // Check if the newLocation is already saved in internal
        // locations resources, if so just return the name and guid as qcode
        api('locations').query({
            source: { query: { term: { name: newLocation.nominatim.display_name } } }
        })
        .then(data => {
            if (data._items.length) {
                // we have this location stored already
                let loc = data._items[0]
                return { name: loc.name, qcode: loc.guid }
            } else {
                // this is a new location
                // simplify display for form
                return dispatch(saveNewLocation(newLocation))
                .then(data => ({ name: data.name, qcode: data.guid }))
            }
        })
    )
}
