import {IPlanningItem} from 'interfaces';
import {convertToRaw} from 'draft-js';
import {
    IEditor3Config,
    IEditor3ValueStorage,
    IStorageAdapter,
} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {getFieldDefinitions} from './field-definitions/index';

export const storageAdapterPlanningItem: IStorageAdapter<IPlanningItem> = {
    storeValue: (value, fieldId, item, config, fieldType) => {
        const {computeEditor3Output} = superdeskApi.helpers;
        const fieldDefinitions = getFieldDefinitions();
        const fieldStorageAdapter = fieldDefinitions[fieldId]?.storageAdapter;

        if (fieldStorageAdapter != null) {
            return fieldStorageAdapter.storeValue(item, value);
        } else if (fieldType === 'editor3') {
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
        const fieldDefinitions = getFieldDefinitions();
        const value = (item as {[key: string]: any})[fieldId] ?? undefined;
        const fieldStorageAdapter = fieldDefinitions[fieldId]?.storageAdapter;

        if (fieldStorageAdapter != null) {
            return fieldStorageAdapter.retrieveStoredValue(item, fieldId);
        } else if (fieldType === 'editor3') {
            const returnValue: IEditor3ValueStorage
                = {rawContentState: convertToRaw(getContentStateFromHtml(value ?? ''))};

            return returnValue;
        } else {
            return value;
        }
    },
};
