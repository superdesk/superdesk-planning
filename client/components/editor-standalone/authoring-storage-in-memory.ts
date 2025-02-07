import ng from 'superdesk-core/scripts/core/services/ng';
import {IAuthoringAutoSave, IAuthoringStorage} from 'superdesk-api';
import {getProfile} from './profile';

export function getAuthoringStorageInMemory<T>(
    profile: 'event' | 'planning',
    item: T,
    onSave: (current: T, original: T) => Promise<T>,
): IAuthoringStorage<T> {
    class NoAutoSave implements IAuthoringAutoSave<T> {
        get(id: string) {
            // return an empty object so authoring-react compares with saved item sees it as dirty
            // otherwise, it is not seen as dirty and wouldn't trigger to fill required fields.
            return Promise.resolve({} as T);
        }

        delete() {
            return Promise.resolve();
        }

        schedule(
            getItem: () => T,
            callback: (autosaved: T) => void,
            autosavedItem: T,
        ) {
            callback(getItem());
        }

        cancel() {
            // noop
        }

        flush(): Promise<void> {
            return Promise.resolve();
        }
    }

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

