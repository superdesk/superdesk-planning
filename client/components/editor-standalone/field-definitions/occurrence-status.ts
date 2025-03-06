import {IAuthoringFieldV2, IDropdownConfigManualSource} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {eventOccurStatuses} from '../../../selectors/vocabs';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {IFieldDefinition} from './interfaces';

export const getOccurrenceStatusField = (): IFieldDefinition => ({
    fieldId: 'occur_status',
    getField: ({required, id, language}) => {
        const vocabularyFromStore = eventOccurStatuses(planningApi.redux.store.getState());
        const options = vocabularyFromStore.map(
            (option) => ({
                id: option.qcode,
                label: getVocabularyItemFieldTranslated(
                    option,
                    'label',
                    language,
                    'name'
                ),
            })
        );

        const fieldConfig: IDropdownConfigManualSource = {
            source: 'manual-entry',
            options: options,
            type: 'text',
            roundCorners: false,
            multiple: false,
            required: required,
        };

        const field: IAuthoringFieldV2 = {
            id: id,
            name: superdeskApi.localization.gettext('Occurrence Status'),
            fieldType: 'dropdown',
            fieldConfig: fieldConfig,
        };

        return field;
    },
    storageAdapterEvent: {
        storeValue: (item, operationalValue: Array<string>) => {
            const vocabularyFromStore = eventOccurStatuses(planningApi.redux.store.getState());

            return {
                ...item,
                occur_status: vocabularyFromStore.find((x) => x.qcode == operationalValue),
            };
        },
        retrieveStoredValue: (item) => {
            return item.occur_status.qcode;
        }
    }
});
