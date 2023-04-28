import {appConfig} from 'appConfig';
import {IVocabularyItem} from 'superdesk-api';
import {
    IPlanningContentProfile,
    IPlanningAPI,
    IEventOrPlanningItem,
    IProfileMultilingualDetails,
    IProfileSchemaTypeString,
} from '../interfaces';
import {planningApi, superdeskApi} from '../superdeskApi';

import {profiles} from '../selectors/forms';
import {updateContentProfiles} from '../actions/forms';

import {sortProfileGroups} from '../utils/contentProfiles';

import {showModalConnectedToStore} from '../utils/ui';
import {ContentProfileModal} from '../components/ContentProfiles/ContentProfileModal';
import {getUsersDefaultLanguage} from '../utils/users';

const RESOURCE = 'planning_types';

function getAll(): Promise<Array<IPlanningContentProfile>> {
    return superdeskApi.dataApi.query<IPlanningContentProfile>(
        RESOURCE,
        1,
        {field: 'name', direction: 'ascending'},
        {},
        200
    )
        .then((response) => {
            response._items.forEach(sortProfileGroups);

            return response._items;
        });
}

function getProfile(contentType: string): IPlanningContentProfile {
    const {getState} = planningApi.redux.store;

    return profiles(getState())[contentType];
}

function getLanguageSchema(profile: IPlanningContentProfile): IProfileSchemaTypeString {
    return profile?.schema?.language as IProfileSchemaTypeString ?? {
        type: 'string',
        required: false,
        field_type: 'single_line',
        languages: [appConfig.default_language],
        multilingual: false,
        default_language: appConfig.default_language,
    };
}

function isMultilingualEnabled(profile: IPlanningContentProfile): boolean {
    return getLanguageSchema(profile).multilingual === true;
}

function getProfileLanguages(profile: IPlanningContentProfile): Array<IVocabularyItem['qcode']> {
    return getLanguageSchema(profile).languages || [];
}

function getProfileDefaultLanguage(profile: IPlanningContentProfile): IVocabularyItem['qcode'] {
    return getLanguageSchema(profile).default_language || getUsersDefaultLanguage(true) || appConfig.default_language;
}

function getMultilingualFields(profile: IPlanningContentProfile): Array<keyof IEventOrPlanningItem> {
    const languageSchema = getLanguageSchema(profile);

    if (languageSchema.multilingual !== true) {
        return [];
    }

    return (Object.keys(profile.schema) as Array<keyof IEventOrPlanningItem>)
        .filter((fieldName) => {
            const field = profile.schema[fieldName];

            return fieldName !== 'language' && field?.type === 'string' && field?.multilingual === true;
        });
}

function getMultilingualConfig(contentType: string): IProfileMultilingualDetails {
    const profile = getProfile(contentType);

    return {
        isEnabled: isMultilingualEnabled(profile),
        defaultLanguage: getProfileDefaultLanguage(profile),
        languages: getProfileLanguages(profile),
        fields: getMultilingualFields(profile),
    };
}

function patch(original: IPlanningContentProfile, updates: IPlanningContentProfile): Promise<IPlanningContentProfile> {
    if (original._id == null) {
        delete updates._created;
        delete updates._updated;
        delete updates._etag;
        updates._id = original.name;

        return superdeskApi.dataApi.create<IPlanningContentProfile>(RESOURCE, updates);
    } else {
        return superdeskApi.dataApi.patch<IPlanningContentProfile>(RESOURCE, original, updates);
    }
}

function showManagePlanningProfileModal(): Promise<void> {
    const {gettext} = superdeskApi.localization;

    return showModalConnectedToStore(
        ContentProfileModal,
        {
            title: gettext('Manage Planning Profile'),
            mainProfile: {
                label: gettext('Planning Fields'),
                profile: getProfile('planning'),
                systemRequiredFields: [
                    ['planning_date'],
                    ['slugline', 'headline', 'name'],
                    ['coverages'],
                ],
                disableMinMaxFields: [
                    'language',
                    'marked_for_not_publication',
                    'overide_auto_assign_to_workflow',
                    'associated_event',
                ],
                disableRequiredFields: [
                    'marked_for_not_publication',
                    'overide_auto_assign_to_workflow',
                    'associated_event',
                ],
            },
            embeddedProfile: {
                label: gettext('Coverage Fields'),
                profile: getProfile('coverage'),
                systemRequiredFields: [
                    ['g2_content_type'],
                    ['scheduled']
                ],
                disableMinMaxFields: [
                    'g2_content_type',
                    'language',
                    'genre',
                    'news_coverage_status',
                    'no_content_linking',
                ],
                disableRequiredFields: [
                    'no_content_linking',
                ],
            },
        }
    );
}

function showManageEventProfileModal(): Promise<void> {
    const {gettext} = superdeskApi.localization;

    return showModalConnectedToStore(
        ContentProfileModal,
        {
            title: gettext('Manage Event Profile'),
            mainProfile: {
                label: gettext('Event Fields'),
                profile: getProfile('event'),
                systemRequiredFields: [
                    ['dates'],
                    ['slugline', 'name'],
                ],
                disableMinMaxFields: [
                    'language',
                    'location',
                    'related_plannings',
                ],
                disableRequiredFields: [],
            },
        }
    );
}

function updateProfilesInStore(): Promise<void> {
    const {dispatch} = planningApi.redux.store;

    return getAll().then((profileArray) => {
        dispatch(updateContentProfiles(profileArray.reduce(
            (profiles, profile) => {
                profiles[profile.name] = profile;

                return profiles;
            },
            {}
        )));
    });
}

export const contentProfiles: IPlanningAPI['contentProfiles'] = {
    getAll: getAll,
    get: getProfile,
    patch: patch,
    showManagePlanningProfileModal: showManagePlanningProfileModal,
    showManageEventProfileModal: showManageEventProfileModal,
    updateProfilesInStore: updateProfilesInStore,
    multilingual: {
        getLanguageSchema: getLanguageSchema,
        isEnabled: isMultilingualEnabled,
        getLanguages: getProfileLanguages,
        getFields: getMultilingualFields,
        getConfig: getMultilingualConfig,
    },
    getDefaultLanguage: getProfileDefaultLanguage,
};
