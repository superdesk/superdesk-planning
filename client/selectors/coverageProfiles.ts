import {ICoverageContentProfile, IG2ContentType} from 'interfaces';
import {get} from 'lodash';
import {createSelector} from 'reselect';

export const coverageProfiles: (state: any) => Array<ICoverageContentProfile>
    = (state) => (state?.coverageProfiles?.profiles ?? []);

export const oldProfile: (state: any) => ICoverageContentProfile
    = (state) => get(state, 'forms.profiles.coverage', {});

export const getCoverageProfileByContentType = createSelector(
    [
        coverageProfiles,
        (_state: any, contentType: IG2ContentType['qcode']) => contentType,
    ],
    (profiles, contentType): ICoverageContentProfile | undefined => {
        return profiles.find((profile) => profile.content_type === contentType);
    }
);
