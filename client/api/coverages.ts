import {IPlanningAPI} from '../interfaces';
import {coverageProfile} from '../selectors/forms';
import {planningApi} from '../superdeskApi';

function getCoverageEditorProfile() {
    return coverageProfile(planningApi.redux.store.getState());
}

export const coverages: IPlanningAPI['coverages'] = {
    getEditorProfile: getCoverageEditorProfile,
};
