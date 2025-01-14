import ng from 'superdesk-core/scripts/core/services/ng';
import {IAuthoringStorage} from 'superdesk-api';
import {getProfile} from './profile';
import {NoAutoSave} from './authoring-autosave';

export function getAuthoringStorageInMemory<T>(
    profile: 'event' | 'planning',
    item: T,
    onSave: (current: T, original: T) => Promise<T>,
): IAuthoringStorage<T> {
    const authoringStorage: IAuthoringStorage<T> = {
        autosave: new NoAutoSave(),

        getEntity: () => {
            return Promise.resolve(item);
        },

        isLockedInCurrentSession: () => true,

        forceLock: (entity) => {
            return Promise.resolve(entity);
        },

        saveEntity: (current, original) => {
            return onSave(current, original);
        },
        getContentProfile: () => {
            return Promise.resolve(getProfile(profile));
        },
        closeAuthoring: (_current, original, hasUnsavedChanges, _cancelAutosave, doClose) => {
            return Promise.resolve();
        },
        getUserPreferences: () => ng.get('preferencesService').get()
    };

    return authoringStorage;
}

