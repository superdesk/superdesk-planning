import ng from 'superdesk-core/scripts/core/services/ng';
import {IAuthoringStorage} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {getProfile} from './profile';
import {omitFields} from './utils';
import {AutoSaveHttp} from './authoring-autosave';
import {eventUtils} from '../../utils';

export const authoringStorageEventItemHttp: IAuthoringStorage<IEventItem> = {
    autosave: new AutoSaveHttp<IEventItem>(
        'event_autosave',
        (item) => eventUtils.modifyForServer(item) as IEventItem,
        (item) => eventUtils.modifyForClient(item) as IEventItem,
        1000,
    ),

    getEntity: (id) => {
        const {httpRequestJsonLocal} = superdeskApi;

        return httpRequestJsonLocal<IEventItem>({
            method: 'GET',
            path: `/events/${id}`,
        }).then((saved) => eventUtils.modifyForClient(saved));
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
            path: `/events/${original._id}`,
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
        return Promise.resolve(getProfile('event'));
    },
    closeAuthoring: (_current, original, hasUnsavedChanges, _cancelAutosave, doClose) => {
        return Promise.resolve();
    },
    getUserPreferences: () => ng.get('preferencesService').get()
};
