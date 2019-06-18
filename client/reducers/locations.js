import {uniqBy, remove, get} from 'lodash';
import {LOCATIONS} from '../constants';


const initialState = {locations: [], searchQuery: '', editLocationId: '', pageNum: 1, loading: false, editOpen: false};

const locations = (state = initialState, action) => {
    switch (action.type) {
    case LOCATIONS.ACTIONS.RECIEVE_NEW_LOCATIONS:
        return {...state,
            locations: uniqBy([...action.payload], '_id'),
            pageNum: 1,
            loading: false,
            editLocationId: ''};
    case LOCATIONS.ACTIONS.RECIEVE_LOCATIONS:
        return {...state,
            locations: uniqBy([...state.locations, ...action.payload.items], '_id'),
            pageNum: action.payload.pageNum,
            loading: false};
    case LOCATIONS.ACTIONS.LOCATIONS_CHANGE_LIST_SETTINGS:
        return {...state,
            searchQuery: action.payload.searchQuery,
        };
    case LOCATIONS.ACTIONS.EDIT_LOCATION:
        return {...state,
            editLocationId: action.payload.location._id,
            editOpen: true,
        };
    case LOCATIONS.ACTIONS.START_LOADING_LOCATION:
        return {...state, loading: true};
    case LOCATIONS.ACTIONS.REMOVE_LOCATION:
        var newLocations = [...state.locations];

        remove(newLocations, (l) => l._id == get(action, 'payload.location._id'));
        return {...state, locations: newLocations, editLocationId: ''};
    case LOCATIONS.ACTIONS.UPDATE_LOCATION:
        var updLocations = [...state.locations];
        var indx = updLocations.findIndex((obj) => obj._id == get(action.payload, '_id'));

        updLocations[indx] = action.payload;
        return {...state, locations: updLocations, editLocationId: '', editOpen: false};
    case LOCATIONS.ACTIONS.CANCEL_EDIT:
        return {...state, editLocationId: '', editOpen: false};
    case LOCATIONS.ACTIONS.CREATE_LOCATION:
        return {...state, editOpen: true};
    case LOCATIONS.ACTIONS.SET_BROWSE:
        return {...state, searchTypeSearch: false};
    case LOCATIONS.ACTIONS.SET_SEARCH:
        return {...state, searchTypeSearch: true};
    default:
        return state;
    }
};

export default locations;
