import {formatAddress} from '../utils';
import {get} from 'lodash';

const saveNominatim = (nominatim) => (
    (dispatch, getState, {api}) => {
        const {address} = formatAddress(nominatim);

        return api('locations').save({}, {
            unique_name: nominatim.display_name,
            name: nominatim.namedetails.name,
            address: address,
            position: {
                latitude: nominatim.lat,
                longitude: nominatim.lon,
            },
        });
    }
);

const saveFreeTextLocation = (location) => (
    (dispatch, getState, {api}) => (
        api('locations').save({}, {
            unique_name: location,
            name: location,
        })
    )
);

const saveLocation = (newLocation) => (
    (dispatch) => {
        const uniqueName = get(newLocation, 'nominatim.display_name')
            || get(newLocation, 'name')
            || newLocation;
        // Check if the newLocation is already saved in internal
        // locations resources, if so just return the name and guid as qcode

        return dispatch(self.getLocation(uniqueName, true))
            .then((data) => {
                if (data._items.length) {
                    // we have this location stored already
                    return data._items[0];
                }

                // this is a new location
                if (newLocation.nominatim) {
                    return dispatch(self.saveNominatim(newLocation.nominatim))
                        .then(
                            (result) => Promise.resolve(result),
                            () => Promise.reject('Failed to save location.!')
                        );
                }

                return dispatch(self.saveFreeTextLocation(uniqueName))
                    .then(
                        (result) => Promise.resolve(result),
                        () => Promise.reject('Failed to save location.!')
                    );
            })
            .then((data) => {
                const eventData = {
                    name: data.name,
                    qcode: data.guid,
                };

                if (data.position) {
                    eventData.location = {
                        lat: data.position.latitude,
                        lon: data.position.longitude,
                    };
                }

                if (get(data, 'address.external.nominatim.address')) {
                    eventData.address = data.address;
                    delete eventData.address.external;
                }

                return eventData;
            });
    }
);

const getLocation = (searchText, unique = false) => (
    (dispatch, getState, {api}) => {
        if (unique) {
            return api('locations').query(
                {
                    source: {
                        query: {
                            bool: {
                                must: [{term: {unique_name: {value: searchText}}}],
                            },
                        },
                    },
                });
        } else {
            return api('locations')
                .query({
                    source: {
                        query: {
                            bool: {
                                must: [{
                                    query_string: {
                                        default_field: 'name',
                                        query: searchText + '*',
                                    },
                                }],
                            },
                        },
                    },
                });
        }
    }
);

// eslint-disable-next-line consistent-this
const self = {
    saveNominatim,
    saveFreeTextLocation,
    saveLocation,
    getLocation
};

export default self;
