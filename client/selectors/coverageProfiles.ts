import {get} from 'lodash';

export const coverageProfiles = (state) => get(state, 'coverageProfiles.profiles', {});
