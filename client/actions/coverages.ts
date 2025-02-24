import {ICoverageContentProfile} from '../interfaces';
import {COVERAGES} from '../constants';

export function updateCoverageProfiles(profiles: {[key: string]: ICoverageContentProfile}) {
    return {
        type: COVERAGES.UPDATE_PROFILES,
        payload: profiles,
    };
}
