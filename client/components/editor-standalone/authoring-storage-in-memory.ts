import ng from 'superdesk-core/scripts/core/services/ng';
import {IAuthoringAutoSave, IAuthoringStorage} from 'superdesk-api';
import {getProfile} from './profile';
import {cloneDeep} from 'lodash';

export function getAuthoringStorageInMemory<T>(
    profile: 'event' | 'planning',
    item: T,
    onSave: (current: T, original: T) => Promise<T>,
): IAuthoringStorage<T> {
    class NoAutoSave implements IAuthoringAutoSave<T> {
        get(id: string) {
            // return a different reference so authoring-react sees it as having unsaved changes.
            // otherwise, it will consider all saved and won't attempt to save - which won't trigger validation.
            return Promise.resolve({...item});
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

