import {IAuthoringFieldV2, IDropdownConfigManualSource, IVocabularyItem} from 'superdesk-api';
import {IFieldDefinition} from './interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';

export const getPriorityField = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'priority',
        getField: ({id, required, language}) => {
            const priorityVocabulary = planningApi.redux.store.getState().vocabularies.priority;
            const options = priorityVocabulary.map(
                (option) => ({
                    id: option.qcode,
                    label: getVocabularyItemFieldTranslated(
                        option,
                        superdeskApi.helpers.nameof<IVocabularyItem>('label'),
                        language,
                        superdeskApi.helpers.nameof<IVocabularyItem>('name'),
                    ),
                })
            );

            const fieldConfig: IDropdownConfigManualSource = {
                source: 'manual-entry',
                options: options,
                roundCorners: true,
                type: 'text',
                multiple: false,
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: gettext('Priority'),
                fieldType: 'dropdown',
                fieldConfig: fieldConfig,
            };

            return field;
        },
    };
};
