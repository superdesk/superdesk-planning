import { hideModal } from './modal'
import { pickBy } from 'lodash'

const receiveEvents = (events) => ({
    type: 'RECEIVE_EVENTS',
    events,
    receivedAt: Date.now()
})
const requestEvents = () => ({
    type: 'REQUEST_EVENTS'
})
export const addEvent = (event) => ({
    type: 'ADD_EVENT', event
})
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
            unique_name: newLocation.gmaps.formatted_address,
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
        // TODO: check if the newLocation is already saved in internal
        // locations resources, if so just return the name and
        // guid (but should be a promise)
        api('locations').query({
            unique_name: newLocation.gmaps.formatted_address
        })
        .then(data => {
            if (data._items) {
                // we have this location stored already
                return new Promise(() => data._items[0]) 
            } else {
                // this is a new location
                return dispatch(saveNewLocation(newLocation))
            } 
        })
    }            
)
export const saveEvent = (newEvent) => (
    (dispatch, getState, { api }) => {
        let events = getState().events
        // retrieve original
        let original = events.find((e) => e._id === newEvent._id)
        // clone the original because `save` will modify it
        original = original ? Object.assign({}, original) : {}
        // remove all properties starting with _,
        // otherwise it will fail for "unknown field" with `_type`
        newEvent = pickBy(newEvent, (v, k) => (!k.startsWith('_')))
        // save location before saving event
        dispatch(saveLocation(newEvent.location[0].name))
        .then(newLocation => {
            // map location fields
            newEvent.location = [
                { 
                    name: newLocation.name,
                    qcode: newLocation.guid
                }
            ]

            return api('events').save(original, newEvent)
            // add the event to the store
            .then(data => {
                dispatch(addEvent(data))
                // notify the end of the action and reset the form
                dispatch({ type: 'EVENT_SAVE_SUCCESS' })
                // hide the modal
                return dispatch(hideModal())
            })
        })
    }
)
export const fetchEvents = () => (
    (dispatch, getState, { api }) => {
        dispatch(requestEvents())
        let futureEvent = { query: { range: { 'dates.start': { gte: 'now/d' } } } }
        return api('events').query({
            sort: '[("dates.start",1)]',
            source: JSON.stringify(futureEvent)
        })
        .then(data => dispatch(receiveEvents(data._items)))
    }
)
