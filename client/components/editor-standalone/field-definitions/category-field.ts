import {IDropdownConfigVocabulary, IAuthoringFieldV2, IVocabularyItem} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition, IFieldStorageAdapter} from './interfaces';
import {IPlanningItem, IEventItem} from 'globals';

function getStorageAdapterCommon<T extends IPlanningItem | IEventItem>(): IFieldStorageAdapter<T> {
    const storageAdapterCommon: IFieldStorageAdapter<T> = {
        storeValue: (item, operationalValue: string | Array<string> | null) => {
            const vocabulary = superdeskApi.entities.vocabulary.getAll().get('categories');
            const vocabularyItems = new Map<IVocabularyItem['qcode'], IVocabularyItem>(
                vocabulary.items.map((item) => [item.qcode, item]),
            );

            /**
             * When `multiple` is set to false in fieldConfig, operationalValue is `string` or `null`.
             */
            const convertedValue = typeof operationalValue === 'string'
                ? [operationalValue]
                : operationalValue ?? [];

            return {
                ...item,
                anpa_category: convertedValue.map((qcode) => vocabularyItems.get(qcode)),
            };
        },
        retrieveStoredValue: (item, fieldId) => (item[fieldId] ?? []).map(({qcode}) => qcode),
    };

    return storageAdapterCommon;
}

export const getCategoriesField = (): IFieldDefinition => ({
    fieldId: 'anpa_category',
    getField: ({id, required}) => {
        const vocabularyId = 'categories';
        const vocabulary = superdeskApi.entities.vocabulary.getVocabulary(vocabularyId);

        const fieldConfig: IDropdownConfigVocabulary = {
            source: 'vocabulary',
            vocabularyId: vocabularyId,
            multiple: vocabulary.selection_type === 'multi selection',
            required: required,
        };

        const field: IAuthoringFieldV2 = {
            id: id,
            name: vocabulary.display_name,
            fieldType: 'dropdown',
            fieldConfig: fieldConfig,
        };

        return field;
    },
    storageAdapterPlanning: getStorageAdapterCommon(),
    storageAdapterEvent: getStorageAdapterCommon(),
});
