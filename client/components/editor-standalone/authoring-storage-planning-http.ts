import ng from 'superdesk-core/scripts/core/services/ng';
import {IPlanningItem} from 'interfaces';
import {IAuthoringStorage} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {getProfile} from './profile';
import {omitFields} from './utils';
import {AutoSaveHttp} from './authoring-autosave';
import {getErrorMessage, planningUtils} from '../../utils';
import {gettext} from 'core/utils';

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
                    planningUtils.modifyForServer(current),
                ),
            ),
            headers: {
                'If-Match': original._etag,
            },
        }).catch((e) => {
            superdeskApi.ui.notify.error(
                getErrorMessage(e, gettext('Couldn\'t save item'))
            );

            return Promise.reject();
        });
    },
    getContentProfile: () => {
        return Promise.resolve(getProfile('planning'));
    },
    closeAuthoring: (_current, original, hasUnsavedChanges, _cancelAutosave, doClose) => {
        return Promise.resolve();
    },
    getUserPreferences: () => ng.get('preferencesService').get()
};
