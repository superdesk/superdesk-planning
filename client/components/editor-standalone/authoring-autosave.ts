import moment from 'moment';
import {IAuthoringAutoSave, IBaseRestApiResponse} from 'superdesk-api';
import * as selectors from '../../selectors';
import {throttle, DebouncedFunc} from 'lodash';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {omitFields} from './utils';
import {IEventOrPlanningItem} from '../../interfaces';

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

    private autosave(getItem: () => T, previousAutosavedItem: T, callback: (autosaved: T) => void) {
        const {httpRequestJsonLocal} = superdeskApi;

        const item: T = this.modifyForServer(getItem());
        let result: Promise<T>;

        if (previousAutosavedItem != null) {
            const {
                lock_action,
                lock_user,
                lock_session,
                lock_time,
            } = previousAutosavedItem;

            result = httpRequestJsonLocal<T>({
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
        } else {
            const {getState} = planningApi.redux.store;

            const lockInfo = {
                lock_action: 'edit',
                lock_user: selectors.general.currentUserId(getState()),
                lock_session: selectors.general.sessionId(getState()),
                lock_time: moment(),
            };

            result = httpRequestJsonLocal<T>({
                method: 'POST',
                path: `/${this.resource}`,
                payload: omitFields({
                    ...item,
                    ...lockInfo,
                }),
            });
        }

        result.then((res) => {
            this.autosavePromise = null;

            const result = this.modifyForClient(res);

            callback(result);
        });
    }

    public get(id: T['_id']) {
        const {httpRequestJsonLocal} = superdeskApi;

        return httpRequestJsonLocal<T>({
            method: 'GET',
            path: `/${this.resource}/${id}`,
        }).then(this.modifyForClient);
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
