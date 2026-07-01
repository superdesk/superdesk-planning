import type {IAuthoringAutoSave, IBaseRestApiResponse} from 'superdesk-api';
import type {IEventOrPlanningItem} from '../../interfaces';
import moment from 'moment';
import * as selectors from '../../selectors';
import {throttle, DebouncedFunc} from 'lodash';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {omitFields} from './utils';

export class AutoSaveHttp<T extends IBaseRestApiResponse & IEventOrPlanningItem> implements IAuthoringAutoSave<T> {
    private autoSaveThrottled: DebouncedFunc<typeof this.autosave>;

    private autosavePromise: Promise<void> | null;

    private resource: string;
    private modifyForServer: (item: T) => T;
    private modifyForClient: (item: T) => T;

    constructor(
        autosaveResource: string,
        modifyForServer: (item: T) => T,
        modifyForClient: (item: T) => T,
        delay: number,
    ) {
        this.resource = autosaveResource;
        this.modifyForServer = modifyForServer;
        this.modifyForClient = modifyForClient;

        this.autoSaveThrottled = throttle(this.autosave, delay, {leading: false});
    }

    private updateAutosave(item: T, previousAutosavedItem: T): Promise<T> {
        const {httpRequestJsonLocal} = superdeskApi;
        const {lock_action, lock_user, lock_session, lock_time} = previousAutosavedItem;

        return httpRequestJsonLocal<T>({
            method: 'PATCH',
            path: `/${this.resource}/${item._id}`,
            payload: {
                ...omitFields(item, true),
                lock_action,
                lock_user,
                lock_session,
                lock_time,
            },
            headers: {
                'If-Match': previousAutosavedItem._etag,
            },
        });
    }

    private createAutosave(item: T): Promise<T> {
        const {httpRequestJsonLocal} = superdeskApi;
        const {getState} = planningApi.redux.store;

        const lockInfo = {
            lock_action: 'edit',
            lock_user: selectors.general.currentUserId(getState()),
            lock_session: selectors.general.sessionId(getState()),
            lock_time: moment(),
        };

        return httpRequestJsonLocal<T>({
            method: 'POST',
            path: `/${this.resource}`,
            payload: omitFields({
                ...item,
                ...lockInfo,
            }),
        });
    }

    private autosave(getItem: () => T, previousAutosavedItem: T, callback: (autosaved: T) => void) {
        const item: T = this.modifyForServer(getItem());

        const request = previousAutosavedItem == null
            ? this.createAutosave(item)
            : this.updateAutosave(item, previousAutosavedItem).catch((error) => {
                // The autosave document may no longer exist on the server, e.g. it was deleted
                // by a manual save or purged once its lock expired. Recreate it rather than
                // failing the autosave with a 404. Match both error shapes the local http
                // helper can surface (`internal_error` and the Eve `_error.code`).
                if (error?.internal_error === 404 || error?._error?.code === 404) {
                    return this.createAutosave(item);
                }

                return Promise.reject(error);
            });

        this.autosavePromise = request
            .then((res) => {
                callback(this.modifyForClient(res));
            })
            .catch((error) => {
                // Autosave is best-effort: keep failures out of the uncaught-rejection channel
                // while still surfacing them for debugging.
                console.error(`${this.resource} autosave failed`, error);
            })
            .then(() => {
                this.autosavePromise = null;
            });
    }

    public get(id: T['_id']) {
        const {httpRequestJsonLocal} = superdeskApi;

        return httpRequestJsonLocal<T>({
            method: 'GET',
            path: `/${this.resource}/${id}`,
        }).then((res) => this.modifyForClient(res));
    }

    public delete(id: T['_id'], etag: T['_etag']) {
        const {httpRequestRawLocal} = superdeskApi;

        return httpRequestRawLocal<T>({
            method: 'DELETE',
            path: `/${this.resource}/${id}`,
            headers: {
                'If-Match': etag,
            },
        }).then(() => undefined);
    }

    public schedule(getItem: () => T, callback: (autosaved: T) => void, previousAutosavedItem: T,) {
        this.autoSaveThrottled(getItem, previousAutosavedItem, callback);
    }

    public flush(): Promise<void> {
        this.autoSaveThrottled.flush();

        return new Promise((resolve) => {
            if (this.autosavePromise == null) {
                resolve();
            } else {
                this.autosavePromise.then(() => resolve());
            }
        });
    }

    public cancel() {
        this.autoSaveThrottled.cancel();
    }
}
