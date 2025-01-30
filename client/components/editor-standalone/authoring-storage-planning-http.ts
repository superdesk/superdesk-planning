import ng from 'superdesk-core/scripts/core/services/ng';
import {IPlanningItem} from 'interfaces';
import {IAuthoringStorage} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {getProfile} from './profile';
import {handleRemovedAssignments, omitFields} from './utils';
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

        return handleRemovedAssignments(current, original).then((updatedOriginal) =>
            httpRequestJsonLocal<IPlanningItem>({
                method: 'PATCH',
                path: `/planning/${updatedOriginal._id}`,
                payload: omitFields(
                    generatePatch(
                        planningUtils.modifyForServer(updatedOriginal),
                        planningUtils.modifyForServer(current),
                    ),
                ),
                headers: {
                    'If-Match': updatedOriginal._etag,
                },
            }),
        );
    },
    getContentProfile: () => {
        return Promise.resolve(getProfile('planning'));
    },
    closeAuthoring: (_current, _original, _hasUnsavedChanges, _cancelAutosave, doClose) => {
        return Promise.resolve();
    },
    getUserPreferences: () => ng.get('preferencesService').get()
};
