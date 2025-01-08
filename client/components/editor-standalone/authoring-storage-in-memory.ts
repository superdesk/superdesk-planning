import ng from 'superdesk-core/scripts/core/services/ng';
import {IPlanningItem} from 'interfaces';
import {IAuthoringStorage} from 'superdesk-api';
import {getProfile} from './profile';
import {NoAutoSavePlanningItem} from './authoring-autosave';

export function getPlanningItemInMemoryAuthoringStorage(
    item: IPlanningItem,
    onSave: (current: IPlanningItem, original: IPlanningItem) => Promise<IPlanningItem>,
): IAuthoringStorage<IPlanningItem> {
    const authoringStoragePlanningItemInMemory: IAuthoringStorage<IPlanningItem> = {
        autosave: new NoAutoSavePlanningItem(),

        getEntity: () => {
            return Promise.resolve({autosaved: item, saved: item});
        },

        isLockedInCurrentSession: () => true,

        forceLock: (entity) => {
            return Promise.resolve(entity);
        },

        saveEntity: (current, original) => {
            return onSave(current, original);
        },
        getContentProfile: () => {
            return Promise.resolve(getProfile());
        },
        closeAuthoring: (_current, original, hasUnsavedChanges, _cancelAutosave, doClose) => {
            return Promise.resolve();
        },
        getUserPreferences: () => ng.get('preferencesService').get()
    };

    return authoringStoragePlanningItemInMemory;
}

