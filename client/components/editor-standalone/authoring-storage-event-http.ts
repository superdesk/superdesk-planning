import ng from 'superdesk-core/scripts/core/services/ng';
import {IAuthoringStorage} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {getProfile} from './profile';
import {omitFields} from './utils';
import {AutoSaveHttp, NoAutoSave} from './authoring-autosave';
import {eventUtils} from '../../utils';

const getAutosavedEventItem = (id: IEventItem['_id']): Promise<IEventItem | null> => {
    return new Promise((resolve) => {
        new AutoSaveHttp<IEventItem>('event_autosave', 0).get(id)
            .then((res) => {
                resolve(res);
            })
            .catch(() => {
                resolve(null);
            });
    });
};

export const authoringStorageEventItemHttp: IAuthoringStorage<IEventItem> = {
    autosave: new NoAutoSave(),
    getEntity: (id) => {
        const {httpRequestJsonLocal} = superdeskApi;

        return Promise.all([
            getAutosavedEventItem(id),
            httpRequestJsonLocal<IEventItem>({
                method: 'GET',
                path: `/planning/${id}`,
            })
        ]).then(([autosaved, saved]) => {
            return {
                autosaved: autosaved == null ? null : eventUtils.modifyForClient(autosaved),
                saved: eventUtils.modifyForClient(saved),
            };
        });
    },

    isLockedInCurrentSession: () => true,

    forceLock: (entity) => {
        return Promise.resolve(entity);
    },

    saveEntity: (current, original) => {
        const {httpRequestJsonLocal} = superdeskApi;
        const {generatePatch} = superdeskApi.utilities;

        return httpRequestJsonLocal<IEventItem>({
            method: 'PATCH',
            path: `/planning/${original._id}`,
            payload: omitFields(
                generatePatch(
                    eventUtils.modifyForServer(original),
                    eventUtils.modifyForServer(current),
                ),
            ),
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
