import {get} from 'lodash';

export const locations = (state) => get(state, 'locations.locations') || [];
export const getLocationSearchQuery = (state) => get(state, 'locations.searchQuery') || '';
export const getEditLocation = (state) => get(state, 'locations.locations',
    []).find((l) => l._id === state.locations.editLocationId);
export const loadingLocations = (state) => !!get(state, 'locations.loading', false);
export const getEditLocationOpen = (state) => !!get(state, 'locations.editOpen', false);
export const getLocationPageNum = (state) => get(state, 'locations.pageNum');
export const getSearchType = (state) => get(state, 'locations.searchTypeSearch', true);
