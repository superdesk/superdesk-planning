import {IAuthoringFieldV2, IDropdownConfigManualSource} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {getLanguages} from '../../../selectors/vocabs';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {IFieldDefinition} from './interfaces';

export const getLanguageField = (): IFieldDefinition => {
    const languages = getLanguages(planningApi.redux.store.getState());

    return {
        fieldId: 'language',
        getField: ({required, id, language}) => {
            const options = languages.map(
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
                name: superdeskApi.localization.gettext('Language'),
                fieldType: 'dropdown',
                fieldConfig: fieldConfig,
            };

            return field;
        },
    };
};
