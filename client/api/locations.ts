import * as Nominatim from 'nominatim-browser';

import {getUserInterfaceLanguage} from 'appConfig';
import {IRestApiResponse} from 'superdesk-api';
import {IPlanningAPI, ILocation, INominatimItem} from '../interfaces';
import {superdeskApi, planningApi} from '../superdeskApi';

import {getErrorMessage} from '../utils';
import {getLocationSearchQuery} from '../selectors/locations';
import * as actions from '../actions';
import {convertNominatimToLocation, getUniqueNameForLocation} from '../utils/locations';

function create(location: Partial<ILocation>): Promise<ILocation> {
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    if (!location.unique_name?.length) {
        location.unique_name = getUniqueNameForLocation(location);
    }

    return superdeskApi.dataApi.create<ILocation>('locations', location)
        .then((location) => {
            reloadList();
            notify.success(gettext('The location has been created'));

            return location;
        }, (error) => {
            notify.error(
                error?.data?._issues?.unique_name?.unique != null ?
                    gettext('A location matching this one already exists') :
                    getErrorMessage(
                        error,
                        gettext('Failed to create the location')
                    )
            );

            return Promise.reject(error);
        });
}

function getOrCreate(location: Partial<ILocation>): Promise<ILocation> {
    return getByUniqueName(getUniqueNameForLocation(location))
        .then((foundLocation) => (
            foundLocation != null ?
                foundLocation :
                create(location)
        ));
}

function update(original: ILocation, updates: Partial<ILocation>): Promise<ILocation> {
    const {dispatch} = planningApi.redux.store;
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    if (!updates.address?.locality?.length) {
        updates.address.locality = updates.address.city ?? original.address.city;
    }

    return superdeskApi.dataApi.patch<ILocation>('locations', original, updates)
        .then((location) => {
            dispatch(actions.locations.updateLocation(location));
            notify.success(gettext('The location has been updated'));

            return location;
        }, (error) => {
            notify.error(
                getErrorMessage(
                    error,
                    gettext('Failed to update location')
                )
            );

            return Promise.reject(error);
        });
}

function deleteLocation(location: ILocation): Promise<void> {
    const {dispatch} = planningApi.redux.store;
    const {gettext} = superdeskApi.localization;
    const {notify} = superdeskApi.ui;

    return superdeskApi.dataApi.delete<ILocation>('locations', location)
        .then(() => {
            dispatch(actions.locations.removeLocation(location));

            notify.success(gettext('Location deleted'));
        }, (error) => {
            notify.error(
                getErrorMessage(
                    error,
                    gettext('Failed to delete the location')
                )
            );

            return Promise.reject(error);
        });
}

function closeEditor() {
    const {dispatch} = planningApi.redux.store;

    dispatch(actions.locations.closeEditor());
}

function getByUniqueName(name: string): Promise<ILocation | undefined> {
    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<ILocation>>(
        'locations',
        {
            source: JSON.stringify({
                query: {
                    bool: {
                        must: [{term: {unique_name: {value: name}}}],
                        must_not: [{term: {is_active: {value: false}}}],
                    },
                },
            }),
        }
    )
        .then((response) => {
            if (response._items?.length) {
                return response._items[0];
            }
        });
}

function browse(searchText: string, page: number = 1): Promise<IRestApiResponse<ILocation>> {
    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<ILocation>>(
        'locations',
        {
            source: JSON.stringify({
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
                            {
                                term: {
                                    is_active: {
                                        value: false,
                                    },
                                },
                            },
                        ],
                    },
                },
            }),
            max_results: 200,
            sort: '[(\'unique_name\', 1)]',
            page: page,
        }
    );
}

function search(searchText?: string, page: number = 1): Promise<IRestApiResponse<ILocation>> {
    const terms = searchText?.length ?
        searchText.split(' ') :
        ['*'];
    const queryString = (terms.length > 1 ?
        terms.join('* ') :
        terms[0]
    ) + '*';
    const params: {[key: string]: any} = {
        source: JSON.stringify({
            query: {
                bool: {
                    must: [{
                        query_string: {
                            fields: [
                                'name',
                                'address.line',
                                'address.area',
                                'address.postal_code',
                                'address.country',
                                'address.locality',
                                'address.city',
                                'address.state',
                            ],
                            query: queryString,
                            default_operator: 'AND',
                        },
                    }],
                    must_not: {
                        term: {is_active: false},
                    },
                },
            },
        }),
        max_results: 200,
        page: page,
    };

    if (!searchText?.length) {
        params.sort = '[(\'unique_name\', 1)]';
    }

    return superdeskApi.dataApi.queryRawJson<IRestApiResponse<ILocation>>(
        'locations',
        params
    );
}

function searchExternal(searchText?: string, language?: string): Promise<Array<Partial<ILocation>>> {
    if (!searchText?.length) {
        return Promise.resolve([]);
    }


    return Nominatim.geocode({
        q: searchText,
        addressdetails: true,
        extratags: true,
        namedetails: true,
        // @ts-ignore - Not defined in `nominatim-browser` package
        'accept-language': language || getUserInterfaceLanguage(),
    })
        .then((response: Array<INominatimItem>) => (
            response.map(
                (item) => convertNominatimToLocation(item))
        ));
}

function reloadList() {
    const {dispatch, getState} = planningApi.redux.store;

    dispatch<any>(actions.locations.searchLocations(getLocationSearchQuery(getState())));
}

export const locations: IPlanningAPI['locations'] = {
    create: create,
    getOrCreate: getOrCreate,
    update: update,
    delete: deleteLocation,
    closeEditor: closeEditor,
    getByUniqueName: getByUniqueName,
    browse: browse,
    search: search,
    searchExternal: searchExternal,
    reloadList: reloadList,
};
