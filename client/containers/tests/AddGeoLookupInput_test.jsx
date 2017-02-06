import sinon from 'sinon'
import * as actions from '../../actions'

const sdLocation = {
    guid: 'location-guid',
    qcode: 'location-qcode',
    name: '123 road, state, postcode, country'
}

const nominatimLocation = {
    nominatim: {
        display_name: 'display location',
        lat: 'lat',
        lon: 'lon',
        address: {
            house_number: '123',
            road: 'road',
            state: 'state',
            town: 'town',
            postcode: 'postcode',
            country: 'country'
        }
    }
}

const formattedLocation = {
    unique_name: 'display location',
    name: '123 road, state, postcode, country',
    address: {
        line: ['123 road'],
        locality: 'state',
        area: 'town',
        country: 'country',
        postal_code: 'postcode',
        position: {
            latitude: 'lat',
            longitude: 'lon' 
        },
        external: nominatimLocation,
    }
}

describe('<AddGeoLookupInput />', () => {
    it('saves a new location', () => {
        const getState = () => ({ events: { events: [] } })
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const api = () => ({
            save: sinon.spy((original, newLocation) => {
                expect(newLocation.unique_name).toEqual(formattedLocation.unique_name)
                expect(newLocation.name).toEqual(formattedLocation.name)
                expect(newLocation.position).toEqual(formattedLocation.address.position)
                expect(newLocation.address.line).toEqual(formattedLocation.address.line)
                expect(newLocation.address.locality).toEqual(formattedLocation.address.locality)
                expect(newLocation.address.area).toEqual(formattedLocation.address.area)
                expect(newLocation.address.country).toEqual(formattedLocation.address.country)
                expect(newLocation.address.postal_code).toEqual(formattedLocation.address.postal_code)
                return Promise.resolve()
            })
        })
        const action = actions.saveNewLocation(nominatimLocation)
        action(dispatch, getState, { api })
    })

    it('displays saved location', () => {
        const getState = () => ({ events: { events: [] } })
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const api = () => ({
            query: sinon.spy(() => {
                return Promise.resolve({
                    _items: [ sdLocation ]
                })
            })
        })
        const action = actions.saveLocation(nominatimLocation)
        action(dispatch, getState, { api })
        .then((savedLocation) => {
            expect(savedLocation).toEqual({
                qcode: 'location-guid',
                name: '123 road, state, postcode, country'
            })
        })
    })
})
