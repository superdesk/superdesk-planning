import {IPlanningItem} from 'interfaces';
import {convertToRaw} from 'draft-js';
import {
    IEditor3Config,
    IEditor3ValueStorage,
    IStorageAdapter,
} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';

export const storageAdapterPlanningItem: IStorageAdapter<IPlanningItem> = {
    storeValue: (value, fieldId, item, config, fieldType) => {
        const {computeEditor3Output} = superdeskApi.helpers;

        if (fieldType === 'editor3') {
            const editor3Config = config as IEditor3Config;
            const rawState = (value as IEditor3ValueStorage).rawContentState;

            const computed = computeEditor3Output(
                rawState,
                editor3Config,
                item.language ?? 'en',
            );

            return {
                ...item,
                [fieldId]: computed.stringValue,
            };
        } else {
            return {
                ...item,
                [fieldId]: value,
            };
        }
    },

    retrieveStoredValue: (item, fieldId, fieldType) => {
        const {getContentStateFromHtml} = superdeskApi.helpers;
        const value = (item as {[key: string]: any})[fieldId] ?? undefined;

        if (fieldType === 'editor3') {
            const returnValue: IEditor3ValueStorage
                    = {rawContentState: convertToRaw(getContentStateFromHtml(value ?? ''))};

            return returnValue;
        } else {
            return value;
        }
    },
};
