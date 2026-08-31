import {IPlanningContentProfile, ICoverageType, IG2ContentType} from 'interfaces';
import {get} from 'lodash';
import {createSelector} from 'reselect';

export const coverageProfiles: (state: any) => Array<IPlanningContentProfile>
    = (state) => (state?.coverageProfiles?.profiles ?? []);

export const oldProfile: (state: any) => IPlanningContentProfile
    = (state) => get(state, 'forms.profiles.coverage', {});

export const getCoverageProfileByContentType = createSelector(
    [
        coverageProfiles,
        (_state: any, contentType: IG2ContentType['qcode']) => contentType,
    ],
    (profiles, contentType): IPlanningContentProfile | undefined => {
        return profiles.find((profile) => profile.content_type === contentType);
    }
);

export const getCoverageProfilesMap = createSelector(
    coverageProfiles,
    (profiles): Record<ICoverageType, IPlanningContentProfile> => {
        return profiles.reduce((acc, p) => {
            if (p?.content_type) {
                acc[p.content_type] = p;
            }

            return acc;
        }, {} as Record<ICoverageType, IPlanningContentProfile>);
    }
);
