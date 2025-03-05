import ng from 'superdesk-core/scripts/core/services/ng';
import {IAuthoringAutoSave, IAuthoringStorage} from 'superdesk-api';
import {getProfile} from './profile';
import {autosave} from '../../api/autosave';

export function getAuthoringStorageInMemory<T extends {_id: string}>(
    profile: 'event' | 'planning',
    item: T,
    onSave: (current: T, original: T) => Promise<T>,
): IAuthoringStorage<T> {
    /**
     * Timeout for 500 seconds to let newly added embedded events finish autosaving.
     */
    class NoAutoSave implements IAuthoringAutoSave<T> {
        get(id: string) {
            return new Promise<T>((resolve) => {
                setTimeout(() => {
                    autosave
                        .getById(profile === 'event' ? 'event' : 'planning', id)
                        .then((x) => {
                            if (x == null) {
                                resolve(item);
                            } else {
                                resolve(x as unknown as T);
                            }
                        });
                }, 500);
            });
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
            return new Promise<T>((resolve) => {
                setTimeout(() => {
                    autosave
                        .getById(profile === 'event' ? 'event' : 'planning', item._id)
                        .then((x) => {
                            if (x == null) {
                                resolve(item);
                            } else {
                                resolve(x as unknown as T);
                            }
                        });
                }, 500);
            });
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

