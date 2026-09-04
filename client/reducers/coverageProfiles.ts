import {IPlanningContentProfile, ICoverageProfilesState} from '../interfaces';
import {COVERAGES} from '../constants';
import {createReducer} from './createReducer';

const initialState: ICoverageProfilesState = {
    profiles: [],
};

const coveragesReducer = createReducer(initialState, {
    [COVERAGES.UPDATE_PROFILES]: (state, payload: Array<IPlanningContentProfile>) => ({
        ...state,
        profiles: payload,
    })
});

export default coveragesReducer;
