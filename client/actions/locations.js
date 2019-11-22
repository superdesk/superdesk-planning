import {formatAddress, getErrorMessage, gettext} from '../utils';
import {get, isEmpty} from 'lodash';
import {MODALS, LOCATIONS} from '../constants';
import {showModal} from './index';
import * as selectors from '../selectors';

const locationsSearch = (searchQuery) => ({
    type: LOCATIONS.ACTIONS.LOCATIONS_CHANGE_LIST_SETTINGS,
    payload: {
        searchQuery,
    }});

const editLocation = (location) => ({
    type: LOCATIONS.ACTIONS.EDIT_LOCATION,
    payload: {
        location,
    }});

const updateLocation = (original, updated) => (
    (dispatch, getState, {api, notify}) => {
        if (original) {
            return api('locations').save(original, updated)
                .then((location) => {
                    dispatch({type: LOCATIONS.ACTIONS.UPDATE_LOCATION, payload: location}),
                    notify.success(gettext('The location has been updated'));
                },
                (error) => {
                    notify.error(getErrorMessage(error, gettext('Failed to updated location!')));
                    return Promise.reject(error);
                });
        } else {
            return api('locations').save({}, updated)
                .then((newloctaion) => {
                    dispatch(self.clearEdits());
                    dispatch(self.searchLocations(selectors.locations.getLocationSearchQuery(getState())));
                    notify.success(gettext('The location has been created'));
                    return Promise.resolve(newloctaion);
                },
                (error) => {
                    let errorMessage = get(error, 'data._issues.unique_name.unique') ?
                        gettext('A location matching this one already exists') : getErrorMessage(error);

                    notify.error(errorMessage);
                });
        }
    }
);

const setSearch = () =>
    (
        (dispatch, getState) => {
            dispatch({
                type: LOCATIONS.ACTIONS.SET_SEARCH,
                payload: '',
            }),
            dispatch(self.searchLocations(selectors.locations.getLocationSearchQuery(getState())));
        });


const setBrowse = () =>
    (
        (dispatch, getState) => {
            dispatch({
                type: LOCATIONS.ACTIONS.SET_BROWSE,
                payload: '',
            }),
            dispatch(self.searchLocations(selectors.locations.getLocationSearchQuery(getState())));
        });

const createLocation = () => ({
    type: LOCATIONS.ACTIONS.CREATE_LOCATION,
    payload: '',
});


const deleteLocationConfirmation = (location) => (
    (dispatch, getState, {api}) => {
        dispatch(showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                body: gettext('Do you want to delete the location "{{name}}"?', {name: location.name}),
                action: () => dispatch(deleteLocation(location)),
                autoClose: true,
            },
        }));
    }
);

const deleteLocation = (location) => (
    (dispatch, getState, {api}) => {
        api('locations').remove(location)
            .then(
                dispatch({type: LOCATIONS.ACTIONS.REMOVE_LOCATION, payload: {location}}));
    }
);

const clearEdits = () => ({
    type: LOCATIONS.ACTIONS.CANCEL_EDIT,
    payload: '',
});

const getMoreLocations = () => (
    (dispatch, getState) => {
        dispatch({
            type: LOCATIONS.ACTIONS.START_LOADING_LOCATIONS,
            payload: '',
        }),
        dispatch(self.getLocation(selectors.locations.getLocationSearchQuery(getState()), false,
            selectors.locations.getLocationPageNum(getState()) + 1))
            .then((data) => {
                dispatch({
                    type: LOCATIONS.ACTIONS.RECIEVE_LOCATIONS,
                    payload: {items: get(data, '_items', []),
                        pageNum: selectors.locations.getLocationPageNum(getState()) + 1},
                });
            });
    }
);

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
            ...location,
            unique_name: location.name,
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

                return dispatch(self.saveFreeTextLocation(newLocation))
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

                if (get(data, 'address')) {
                    eventData.address = data.address;
                    if (eventData.address.external) {
                        delete eventData.address.external;
                    }
                }

                return eventData;
            });
    }
);

const searchLocations = (searchText) => (
    (dispatch) => {
        dispatch(self.getLocation(searchText, false))
            .then((data) => {
                dispatch({
                    type: LOCATIONS.ACTIONS.RECIEVE_NEW_LOCATIONS,
                    payload: get(data, '_items', []),
                });
            }),
        dispatch(self.locationsSearch(searchText));
    }
);


const getLocation = (searchText, unique = false, page = 1) => (
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
        }
        if (!get(getState(), 'locations.searchTypeSearch', true)) {
            return api('locations').query(
                {
                    source: {
                        query: {
                            bool: {
                                must: [
                                    {
                                        range: {
                                            unique_name: {
                                                gte: searchText,
                                            },
                                        },
                                    },
                                ],
                                must_not: [
                                    {term: {
                                        is_active: {
                                            value: false,
                                        },
                                    },
                                    },
                                ],
                            },
                        },
                    },
                    max_results: 200,
                    sort: '[(\'unique_name\', 1)]',
                    page: page,
                });
        } else {
            const terms = (!isEmpty(searchText)) ? searchText.split(' ') : '*';
            const queryString = (terms.length > 1 ? terms.join('* ') : terms[0]) + '*';
            const sortString = (isEmpty(searchText) ? '[(\'unique_name\', 1)]' : null);

            return api('locations')
                .query({
                    source: {
                        query: {
                            bool: {
                                must: [{
                                    query_string: {
                                        fields: ['name', 'address.line', 'address.area',
                                            'address.postal_code', 'address.country', 'address.locality'],
                                        query: queryString,
                                        default_operator: 'AND',
                                    },
                                }],
                                must_not: {
                                    term: {is_active: false},
                                },
                            },
                        },
                    },
                    max_results: 200,
                    page: page,
                    sort: sortString,
                });
        }
    }
);

// eslint-disable-next-line consistent-this
const self = {
    saveNominatim,
    saveFreeTextLocation,
    saveLocation,
    getLocation,
    locationsSearch,
    searchLocations,
    editLocation,
    updateLocation,
    getMoreLocations,
    deleteLocation,
    deleteLocationConfirmation,
    clearEdits,
    createLocation,
    setSearch,
    setBrowse,
};

export default self;
