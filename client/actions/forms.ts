import {IPlanningContentProfile} from '../interfaces';
import {FORMS} from '../constants';


export function updateContentProfiles(profiles: {[key: string]: IPlanningContentProfile}) {
    return {
        type: FORMS.ACTIONS.UPDATE_CONTENT_PROFILE,
        payload: profiles,
    };
}
