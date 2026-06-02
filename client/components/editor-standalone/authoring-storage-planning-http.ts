import ng from 'superdesk-core/scripts/core/services/ng';
import {IPlanningItem} from 'interfaces';
import {IAuthoringStorage} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {getProfile} from './profile';
import {omitFields} from './utils';
import {AutoSaveHttp} from './authoring-autosave';
import {planningUtils} from '../../utils';

export const authoringStoragePlanningItemHttp: IAuthoringStorage<IPlanningItem> = {
    autosave: new AutoSaveHttp<IPlanningItem>(
        'planning_autosave',
        (item) => planningUtils.modifyForServer(item) as IPlanningItem,
        (item) => planningUtils.modifyForClient(item) as IPlanningItem,
        1000,
    ),

    getEntity: (id) => {
        const {httpRequestJsonLocal} = superdeskApi;

        return httpRequestJsonLocal<IPlanningItem>({
            method: 'GET',
            path: `/planning/${id}`,
        }).then((saved) => planningUtils.modifyForClient(saved));
    },

    isLockedInCurrentSession: () => true,

    forceLock: (entity) => {
        return Promise.resolve(entity);
    },

    saveEntity: (current, original) => {
        const {httpRequestJsonLocal} = superdeskApi;
        const {generatePatch} = superdeskApi.utilities;
        const patchData = omitFields(
            generatePatch(
                planningUtils.modifyForServer(original),
                planningUtils.modifyForServer(current),
            ),
        );

        return httpRequestJsonLocal<IPlanningItem>({
            method: 'PATCH',
            path: `/planning/${original._id}`,
            payload: patchData,
            headers: {
                'If-Match': original._etag,
            },
        }).then(planningUtils.modifyForClient);
    },

    getContentProfile: (item) => {
        return Promise.resolve(getProfile('planning', item.language));
    },

    closeAuthoring: (_current, _original, _hasUnsavedChanges, _cancelAutosave, _doClose) => {
        return Promise.resolve({cancelled: false});
    },

    getUserPreferences: () => ng.get('preferencesService').get()
};
