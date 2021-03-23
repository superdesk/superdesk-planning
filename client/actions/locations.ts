import {ILocation} from '../interfaces';
import {IRestApiResponse} from 'superdesk-api';
import {planningApi, superdeskApi} from '../superdeskApi';
import {MODALS, LOCATIONS} from '../constants';

import {showModal} from './index';
import * as selectors from '../selectors';

function locationsSearch(searchQuery?: string) {
    return {
        type: LOCATIONS.ACTIONS.LOCATIONS_CHANGE_LIST_SETTINGS,
        payload: {searchQuery}
    };
}

function editLocation(location: ILocation) {
    return {
        type: LOCATIONS.ACTIONS.EDIT_LOCATION,
        payload: {location}
    };
}

function updateLocation(location: ILocation) {
    return {
        type: LOCATIONS.ACTIONS.UPDATE_LOCATION,
        payload: location,
    };
}

function removeLocation(location: ILocation) {
    return {
        type: LOCATIONS.ACTIONS.REMOVE_LOCATION,
        payload: {location: location},
    };
}

function closeEditor() {
    return {type: LOCATIONS.ACTIONS.CANCEL_EDIT};
}

function setSearch() {
    return (dispatch, getState) => {
        dispatch({type: LOCATIONS.ACTIONS.SET_SEARCH});
        dispatch(self.searchLocations(selectors.locations.getLocationSearchQuery(getState())));
    };
}

function setBrowse() {
    return (dispatch, getState) => {
        dispatch({type: LOCATIONS.ACTIONS.SET_BROWSE});
        dispatch(self.searchLocations(selectors.locations.getLocationSearchQuery(getState())));
    };
}

function createLocation() {
    return {type: LOCATIONS.ACTIONS.CREATE_LOCATION};
}

function deleteLocationConfirmation(location: ILocation) {
    const {gettext} = superdeskApi.localization;

    return (dispatch) => {
        dispatch(showModal({
            modalType: MODALS.CONFIRMATION,
            modalProps: {
                body: gettext('Do you want to delete the location "{{ name }}"?', {name: location.name}),
                action: () => planningApi.locations.delete(location),
                autoClose: true,
            },
        }));
    };
}

function getMoreLocations() {
    return (dispatch, getState) => {
        dispatch({type: LOCATIONS.ACTIONS.START_LOADING_LOCATIONS});

        getLocation(
            selectors.locations.getLocationSearchQuery(getState()),
            selectors.locations.getLocationPageNum(getState()) + 1
        )
            .then((response) => {
                dispatch({
                    type: LOCATIONS.ACTIONS.RECIEVE_LOCATIONS,
                    payload: {
                        items: response._items ?? [],
                        pageNum: selectors.locations.getLocationPageNum(getState()) + 1,
                    },
                });
            });
    };
}

function searchLocations(searchText: string) {
    return (dispatch) => {
        getLocation(searchText)
            .then((response) => {
                dispatch({
                    type: LOCATIONS.ACTIONS.RECIEVE_NEW_LOCATIONS,
                    payload: response._items ?? [],
                });
            });
        dispatch(self.locationsSearch(searchText));
    };
}


function getLocation(searchText?: string, page: number = 1): Promise<IRestApiResponse<ILocation>> {
    const {getState} = planningApi.redux.store;

    return selectors.locations.getSearchType(getState()) === true ?
        planningApi.locations.browse(searchText, page) :
        planningApi.locations.search(searchText, page);
}

// eslint-disable-next-line consistent-this
const self = {
    locationsSearch,
    searchLocations,
    updateLocation,
    removeLocation,
    closeEditor,
    editLocation,
    getMoreLocations,
    deleteLocationConfirmation,
    createLocation,
    setSearch,
    setBrowse,
};

export default self;
