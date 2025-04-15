import {IEventItem, IProfileSchemaTypeString} from 'interfaces';
import {ContentState, convertToRaw} from 'draft-js';
import {
    IEditor3Config,
    IEditor3ValueStorage,
    IStorageAdapter,
} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {getFieldDefinitions} from './field-definitions/index';
import {IFieldDefinition, IFieldStorageAdapter} from './field-definitions/interfaces';

export function getStorageAdapter<T extends IPlanningItem | IEventItem>(
    profile: 'event' | 'planning',
    getFieldStorageAdapter: (fieldDefinition: IFieldDefinition) => IFieldStorageAdapter<T>
): IStorageAdapter<T> {
    const storageAdapter: IStorageAdapter<T> = {
        storeValue: (value, fieldId, item, config, fieldType) => {
            const {computeEditor3Output} = superdeskApi.helpers;
            const fieldDefinitions = getFieldDefinitions(profile);
            const fieldStorageAdapter = getFieldStorageAdapter(fieldDefinitions[fieldId]);
            const itemProfile = planningApi.contentProfiles.get(profile);

            if (fieldStorageAdapter != null) {
                return fieldStorageAdapter.storeValue(item, value);
            } else if (fieldType === 'editor3') {
                const editor3Config = config as IEditor3Config;
                const rawState = (value as IEditor3ValueStorage).rawContentState;
                const isMultiLineField = (
                    itemProfile.schema[fieldId] as IProfileSchemaTypeString
                )?.field_type === 'multi_line';

                const computed = computeEditor3Output(
                    rawState,
                    editor3Config,
                    item.language ?? 'en',
                    isMultiLineField,
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
            const fieldDefinitions = getFieldDefinitions(profile);
            const value = (item as {[key: string]: any})[fieldId] ?? undefined;
            const fieldStorageAdapter = getFieldStorageAdapter(fieldDefinitions[fieldId]);
            const itemProfile = planningApi.contentProfiles.get(profile);

            if (fieldStorageAdapter != null) {
                return fieldStorageAdapter.retrieveStoredValue(item, fieldId);
            } else if (fieldType === 'editor3') {
                const isMultiLineField = (
                    itemProfile.schema[fieldId] as IProfileSchemaTypeString
                )?.field_type === 'multi_line';

                if (isMultiLineField) {
                    return {rawContentState: convertToRaw(ContentState.createFromText(value ?? ''))};
                }

                return {rawContentState: convertToRaw(getContentStateFromHtml(value ?? ''))};
            } else {
                return value;
            }
        },
    };

    return storageAdapter;
}
