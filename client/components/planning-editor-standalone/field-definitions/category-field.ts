import {IDropdownConfigVocabulary, IAuthoringFieldV2, IVocabularyItem} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldGetter} from '.';

export const getCategoriesField: IFieldGetter = () => ({
    fieldId: 'anpa_category',
    getField: ({id, required}) => {
        const fieldConfig: IDropdownConfigVocabulary = {
            source: 'vocabulary',
            vocabularyId: 'categories',
            multiple: true,
            required: required,
        };

        const field: IAuthoringFieldV2 = {
            id: id,
            name: superdeskApi.localization.gettext('Categories'),
            fieldType: 'dropdown',
            fieldConfig: fieldConfig,
        };

        return field;
    },
    storageAdapter: {
        storeValue: (item, operationalValue: Array<string>) => {
            const vocabulary = superdeskApi.entities.vocabulary.getAll().get('categories');
            const vocabularyItems = new Map<IVocabularyItem['qcode'], IVocabularyItem>(
                vocabulary.items.map((item) => [item.qcode, item]),
            );

            return {
                ...item,
                anpa_category: operationalValue.map((qcode) => vocabularyItems.get(qcode)),
            };
        },
        retrieveStoredValue: (item, fieldId) => (item[fieldId] ?? []).map(({qcode}) => qcode),
    },
});
