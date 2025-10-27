import {ICoverageContentProfile, ICoverageType, IG2ContentType} from 'interfaces';
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

export const getCoverageProfilesMap = createSelector(
    coverageProfiles,
    (profiles): Record<ICoverageType, ICoverageContentProfile> => {
        return profiles.reduce((acc, p) => {
            if (p?.content_type) {
                acc[p.content_type] = p;
            }

            return acc;
        }, {} as Record<ICoverageType, ICoverageContentProfile>);
    }
);
