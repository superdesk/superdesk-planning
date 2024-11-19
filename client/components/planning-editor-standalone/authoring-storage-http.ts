import ng from 'superdesk-core/scripts/core/services/ng';
import {IPlanningItem} from 'interfaces';
import {IAuthoringStorage} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {getProfile} from './profile';
import {omitFields} from './utils';
import {AutoSavePlanningItem, NoAutoSavePlanningItem} from './authoring-autosave';

const getAutosavedPlanningItem = (id: IPlanningItem['_id']): Promise<IPlanningItem | null> => {
    return new Promise((resolve) => {
        new AutoSavePlanningItem(0).get(id)
            .then((res) => {
                resolve(res);
            })
            .catch(() => {
                resolve(null);
            });
    });
};

export const authoringStoragePlanningItemHttp: IAuthoringStorage<IPlanningItem> = {
    autosave: new NoAutoSavePlanningItem(),
    getEntity: (id) => {
        const {httpRequestJsonLocal} = superdeskApi;

        return Promise.all([
            getAutosavedPlanningItem(id),
            httpRequestJsonLocal<IPlanningItem>({
                method: 'GET',
                path: `/planning/${id}`,
            })
        ]).then(([autosaved, saved]) => {
            return {autosaved, saved};
        });
    },

    isLockedInCurrentSession: () => true,

    forceLock: (entity) => {
        return Promise.resolve(entity);
    },

    saveEntity: (current, original) => {
        const {httpRequestJsonLocal} = superdeskApi;
        const {generatePatch} = superdeskApi.utilities;

        return httpRequestJsonLocal<IPlanningItem>({
            method: 'PATCH',
            path: `/planning/${original._id}`,
            payload: omitFields(generatePatch(original, current)),
            headers: {
                'If-Match': original._etag,
            },
        });
    },
    getContentProfile: () => {
        return Promise.resolve(getProfile());
    },
    closeAuthoring: (_current, original, hasUnsavedChanges, _cancelAutosave, doClose) => {
        return Promise.resolve();
    },
    getUserPreferences: () => ng.get('preferencesService').get()
};
