import ng from 'superdesk-core/scripts/core/services/ng';
import {IPlanningItem} from 'interfaces';
import {IAuthoringStorage} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {getProfile} from './profile';
import {handleRemovedAssignments, omitFields} from './utils';
import {AutoSaveHttp} from './authoring-autosave';
import {planningUtils} from '../../utils';
import {cloneDeep, isEqual} from 'lodash';

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

        return httpRequestJsonLocal<IPlanningItem>({
            method: 'PATCH',
            path: `/planning/${original._id}`,
            payload: omitFields(
                generatePatch(
                    planningUtils.modifyForServer(original),
                    planningUtils.modifyForServer(cloneDeep(current), original),
                ),
            ),
            headers: {
                'If-Match': original._etag,
            },
        }).then((updatedOriginal) => {
            if (current.coverages.some((x) => isEqual(x.assigned_to, {}))) {
                return handleRemovedAssignments(current, updatedOriginal);
            }

            return updatedOriginal;
        });
    },
    getContentProfile: () => {
        return Promise.resolve(getProfile('planning'));
    },
    closeAuthoring: (_current, _original, _hasUnsavedChanges, _cancelAutosave, doClose) => {
        return Promise.resolve();
    },
    getUserPreferences: () => ng.get('preferencesService').get()
};
