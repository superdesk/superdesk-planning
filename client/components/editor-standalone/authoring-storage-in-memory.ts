import ng from 'superdesk-core/scripts/core/services/ng';
import {IAuthoringAutoSave, IAuthoringStorage} from 'superdesk-api';
import {getProfile} from './profile';
import {autosave} from '../../api/autosave';
import {superdeskApi} from '../../superdeskApi';
import {IEventOrPlanningItem} from 'interfaces';

export function getAuthoringStorageInMemory<T extends IEventOrPlanningItem>(
    profile: 'event' | 'planning',
    item: T,
    onSave: (current: T, original: T) => Promise<T>,
): IAuthoringStorage<T> {
    const {assertNever} = superdeskApi.helpers;
    const getProfileType = (profile: 'event' | 'planning') => {
        if (profile === 'event') {
            return 'event';
        } else if (profile === 'planning') {
            return 'planning';
        }

        return assertNever(profile);
    };

    class NoAutoSave implements IAuthoringAutoSave<T> {
        get(id: string) {
            return autosave
                .getById(getProfileType(profile), id)
                .then((x) => {
                    if (x == null) {
                        item;
                    } else {
                        return {...x} as unknown as T;
                    }
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
            return autosave
                .getById(getProfileType(profile), item._id)
                .then((x) => {
                    if (x == null) {
                        return item;
                    } else {
                        return {...x} as unknown as T;
                    }
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
            return Promise.resolve(getProfile(profile, item.language ?? 'en'));
        },

        closeAuthoring: (_current, original, hasUnsavedChanges, _cancelAutosave, doClose) => {
            return Promise.resolve();
        },

        getUserPreferences: () => ng.get('preferencesService').get()
    };

    return authoringStorage;
}

