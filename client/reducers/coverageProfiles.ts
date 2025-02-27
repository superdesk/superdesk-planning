import {ICoverageContentProfile, ICoverageProfilesState} from '../interfaces';
import {COVERAGES} from '../constants';
import {createReducer} from './createReducer';

const initialState: ICoverageProfilesState = {
    profiles: [],
};

const coveragesReducer = createReducer(initialState, {
    [COVERAGES.UPDATE_PROFILES]: (state, payload: Array<ICoverageContentProfile>) => ({
        ...state,
        profiles: payload,
    })
});

export default coveragesReducer;
