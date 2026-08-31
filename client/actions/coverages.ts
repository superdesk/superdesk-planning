import {IPlanningContentProfile} from '../interfaces';
import {COVERAGES} from '../constants';

export function updateCoverageProfiles(profiles: Array<IPlanningContentProfile>) {
    return {
        type: COVERAGES.UPDATE_PROFILES,
        payload: profiles,
    };
}
