import {throttle, DebouncedFunc} from 'lodash';
import {superdeskApi} from '../../superdeskApi';
import {omitFields} from './utils';
import {IAuthoringAutoSave, IBaseRestApiResponse} from 'superdesk-api';

export class AutoSaveHttp<T extends IBaseRestApiResponse> implements IAuthoringAutoSave<T> {
    private autoSaveThrottled: DebouncedFunc<typeof this.autosave>;

    private autosavePromise: Promise<void> | null;

    private latestEtag: string | undefined;
    private resource: string;

    constructor(autosaveResource: string, delay: number) {
        this.latestEtag = undefined;

        this.resource = autosaveResource;

        this.autoSaveThrottled = throttle(this.autosave, delay, {leading: false});
    }

    private autosave(getItem: () => T, callback: (autosaved: T) => void) {
        const {httpRequestJsonLocal} = superdeskApi;
        const item: T = getItem();

        this.autosavePromise = httpRequestJsonLocal<T>({
            method: 'PATCH',
            path: `/${this.resource}/${item._id}`,
            payload: omitFields(item, true),
            headers: {
                'If-Match': this.latestEtag ?? item._etag,
            },
        }).then((res) => {
            this.autosavePromise = null;
            this.latestEtag = res._etag;

            callback(res);
        });
    }

    get(id: T['_id']) {
        const {httpRequestJsonLocal} = superdeskApi;

        return httpRequestJsonLocal<T>({
            method: 'GET',
            path: `/${this.resource}/${id}`,
        });
    }

    delete(id: T['_id'], etag: T['_etag']) {
        const {httpRequestRawLocal} = superdeskApi;

        return httpRequestRawLocal<T>({
            method: 'DELETE',
            path: `/${this.resource}/${id}`,
            headers: {
                'If-Match': etag,
            },
        }).then(() => undefined);
    }

    schedule(getItem: () => T, callback: (autosaved: T) => void) {
        this.autoSaveThrottled(getItem, callback);
    }

    flush(): Promise<void> {
        this.autoSaveThrottled.flush();

        return new Promise((resolve) => {
            if (this.autosavePromise == null) {
                resolve();
            } else {
                this.autosavePromise.then(() => resolve());
            }
        });
    }

    cancel() {
        this.autoSaveThrottled.cancel();
    }
}

export class NoAutoSave<T> implements IAuthoringAutoSave<T> {
    get(id: string) {
        return Promise.resolve(null);
    }

    delete() {
        return Promise.resolve();
    }

    schedule(
        getItem: () => T,
        callback: (autosaved: T) => void,
    ) {
        callback(getItem());
    }

    cancel() {
        // noop
    }

    flush(): Promise<void> {
        return Promise.resolve();
    }
}
