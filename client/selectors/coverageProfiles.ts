import {ICoverageContentProfile} from 'interfaces';
import {get} from 'lodash';

export const coverageProfiles: (state: any) => Array<ICoverageContentProfile>
    = (state) => (state?.coverageProfiles?.profiles ?? []);

export const oldProfile: (state: any) => ICoverageContentProfile
    = (state) => get(state, 'forms.profiles.coverage', {});
