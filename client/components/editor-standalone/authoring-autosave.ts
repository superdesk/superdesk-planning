import {throttle, DebouncedFunc} from 'lodash';
import {superdeskApi} from '../../superdeskApi';
import {IPlanningItem} from '../../interfaces';
import {omitFields} from './utils';
import {IAuthoringAutoSave} from 'superdesk-api';

export class AutoSavePlanningItem implements IAuthoringAutoSave<IPlanningItem> {
    private autoSaveThrottled: DebouncedFunc<typeof this.autosave>;

    private autosavePromise: Promise<void> | null;

    private latestEtag: string | undefined;

    constructor(delay: number) {
        this.latestEtag = undefined;

        this.autoSaveThrottled = throttle(this.autosave, delay, {leading: false});
    }

    private autosave(getItem: () => IPlanningItem, callback: (autosaved: IPlanningItem) => void) {
        const {httpRequestJsonLocal} = superdeskApi;
        const item: IPlanningItem = getItem();

        this.autosavePromise = httpRequestJsonLocal<IPlanningItem>({
            method: 'PATCH',
            path: `/planning_autosave/${item._id}`,
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

    get(id: IPlanningItem['_id']) {
        const {httpRequestJsonLocal} = superdeskApi;

        return httpRequestJsonLocal<IPlanningItem>({
            method: 'GET',
            path: `/planning_autosave/${id}`,
        });
    }

    delete(id: IPlanningItem['_id'], etag: IPlanningItem['_etag']) {
        const {httpRequestRawLocal} = superdeskApi;

        return httpRequestRawLocal<IPlanningItem>({
            method: 'DELETE',
            path: `/planning_autosave/${id}`,
            headers: {
                'If-Match': etag,
            },
        }).then(() => undefined);
    }

    schedule(getItem: () => IPlanningItem, callback: (autosaved: IPlanningItem) => void) {
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


export class NoAutoSavePlanningItem implements IAuthoringAutoSave<IPlanningItem> {
    get(id: string) {
        return Promise.resolve(null);
    }

    delete() {
        return Promise.resolve();
    }

    schedule(
        getItem: () => IPlanningItem,
        callback: (autosaved: IPlanningItem) => void,
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
