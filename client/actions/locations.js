export const saveNewLocation = (newLocation) => (
    (dispatch, getState, { api }) => {
        // Map location.gmaps fields to formattedLocation
        // TODO: refactor with a loop or map function
        let addressComponents = newLocation.gmaps.address_components
        let streetNumber = addressComponents.find((component) => 
            component.types.indexOf('street_number') > -1
        )
        let route = addressComponents.find((component) => 
            component.types.indexOf('route') > -1
        )
        let locality = addressComponents.find((component) => 
            component.types.indexOf('locality') > -1
        )
        let subLocality1 = addressComponents.find((component) => 
            component.types.indexOf('sublocality_level_1') > -1
        )
        let subLocality2 = addressComponents.find((component) => 
            component.types.indexOf('sublocality_level_2') > -1
        )
        let subLocality3 = addressComponents.find((component) => 
            component.types.indexOf('sublocality_level_3') > -1
        )
        let subLocality4 = addressComponents.find((component) => 
            component.types.indexOf('sublocality_level_4') > -1
        )
        let subLocality5 = addressComponents.find((component) => 
            component.types.indexOf('sublocality_level_5') > -1
        )
        let country = addressComponents.find((component) => 
            component.types.indexOf('country') > -1
        )
        let postalCode = addressComponents.find((component) => 
            component.types.indexOf('postal_code') > -1
        )
        let area = subLocality1.short_name
        area += (subLocality2) ? ', ' + subLocality2.short_name : ''
        area += (subLocality3) ? ', ' + subLocality3.short_name : ''
        area += (subLocality4) ? ', ' + subLocality4.short_name : ''
        area += (subLocality5) ? ', ' + subLocality5.short_name : ''
        let address = {
            line: [ streetNumber.short_name + ' ' + route.short_name ],
            locality: locality.short_name,
            area: area,
            country: country.short_name,
            postal_code: postalCode.short_name,
            external: { 
                gmaps: newLocation.gmaps
            }
        }
        let lat = newLocation.gmaps.geometry.location.lat()
        let lng = newLocation.gmaps.geometry.location.lng()
        let formattedLocation = {
            name: newLocation.gmaps.formatted_address,
            address: address,
            position: {
                latitude: lat,
                longitude: lng
            }
        }

        return api('locations').save({}, formattedLocation)
    }
)
export const saveLocation = (newLocation) => (
    (dispatch, getState, { api }) => {
        // Check if the newLocation is already saved in internal
        // locations resources, if so just return the name and guid as qcode
        return api('locations').query({source: {query: {term: {name: newLocation.gmaps.formatted_address}}}})
        .then(data => {
            if (data._items.length) {
                // we have this location stored already
                return {name: data._items[0].name, qcode: data._items[0].guid }
            } else {
                // this is a new location
                return dispatch(saveNewLocation(newLocation))
                .then(data => {
                    return { name: data.name, qcode: data.guid }
                })
            } 
        })
    }            
)
