import {IDropdownConfigVocabulary, IAuthoringFieldV2, IVocabularyItem} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldGetter} from '.';

export const getPlaceField: IFieldGetter = () => ({
    fieldId: 'place',
    getField: ({id, required}) => {
        const fieldConfig: IDropdownConfigVocabulary = {
            source: 'vocabulary',
            vocabularyId: 'locators',
            multiple: true,
            required: required,
        };

        const field: IAuthoringFieldV2 = {
            id: id,
            name: superdeskApi.localization.gettext('Place'),
            fieldType: 'dropdown',
            fieldConfig: fieldConfig,
        };

        return field;
    },
    storageAdapter: {
        storeValue: (item, operationalValue: Array<string>) => {
            const vocabulary = superdeskApi.entities.vocabulary.getAll().get('locators');
            const vocabularyItems = new Map<IVocabularyItem['qcode'], IVocabularyItem>(
                vocabulary.items.map((item) => [item.qcode, item]),
            );

            return {
                ...item,
                place: operationalValue.map((qcode) => vocabularyItems.get(qcode)),
            };
        },
        retrieveStoredValue: (item, fieldId) => item[fieldId].map(({qcode}) => qcode),
    },
});
