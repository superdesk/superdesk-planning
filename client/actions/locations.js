export const saveNewLocation = (newLocation) => (
    (dispatch, getState, { api }) => {
        // Map nominatim fields to NewML Locality
        let formatLocality = (address) => {
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
            localityHierarchy.some((locality) => { 
                if (address.hasOwnProperty(locality)) {
                    return address[locality]
                }
            })
        }
        // Convert nominatim fields to NewsML area
        let formatArea = (address) => {
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
            areaHierarchy.some((area) => { 
                if (address.ocation.hasOwnProperty(area)) {
                    return address[area]
                }
            })
        }

        let address = {
            line: [newLocation.nominatim.address.house_number
                + ' ' + newLocation.nominatim.address.road],
            locality: formatLocality(newLocation.nominatim.address),
            area: formatArea(newLocation.nominatim.address),
            country: newLocation.nominatim.address.country,
            postal_code: newLocation.nominatim.address.postcode,
            external: {
                nominatim: newLocation.nominatim
            }
        }
        let short_name = (address.hasOwnProperty('line') ? address.line[0] : '') +
            + (address.hasOwnProperty('locality') ? ', '+address.locality : '') +
            + (address.hasOwnProperty('state') ? ', '+address.state : '') +
            + (address.hasOwnProperty('postal_code') ? ', '+address.postal_code : '') +
            + (address.hasOwnProperty('country') ? ', '+address.country : '')
        let formattedLocation = {
            unique_name: newLocation.nominatim.display_name,
            name: short_name,
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
)
