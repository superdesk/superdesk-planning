import {ICoverageContentProfile} from '../interfaces';
import {COVERAGES} from '../constants';

export function updateCoverageProfiles(profiles: Array<ICoverageContentProfile>) {
    return {
        type: COVERAGES.UPDATE_PROFILES,
        payload: profiles,
    };
}
