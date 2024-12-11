import {flatMap} from 'lodash';
import {planningApi} from '../../superdeskApi';
import {getEditorFormGroupsFromProfile} from '../../utils/contentProfiles';

interface IBaseField<T> {
    type: T;
    fieldId: string;
    required: boolean;
}

interface ICustomVocabularyField extends IBaseField<'custom_vocabulary'> {
    vocabularyId: string;
}

type IFieldConverted = IBaseField<'normal'> | ICustomVocabularyField;

export const getProfileFieldsConverted = (): Array<IFieldConverted> => {
    const planningProfile = planningApi.contentProfiles.get('planning');
    const planningGroups = getEditorFormGroupsFromProfile(planningProfile);
    const planningFieldIds = Object.values(planningGroups).flatMap((x) => x.fields);
    const convertedFieldIds: Array<IFieldConverted> = [];

    for (const fieldId of planningFieldIds) {
        const fieldSchema = planningProfile.schema[fieldId];

        if (fieldSchema?.type === 'list' && ((fieldSchema.vocabularies ?? []).length > 0)) {
            for (const vocabId of fieldSchema.vocabularies) {
                convertedFieldIds.push({
                    type: 'custom_vocabulary',
                    fieldId: vocabId,
                    required: fieldSchema.required ?? false,
                    vocabularyId: vocabId,
                });
            }
        } else {
            convertedFieldIds.push({
                type: 'normal',
                fieldId: fieldId,
                required: fieldSchema.required ?? false,
            });
        }
    }

    return convertedFieldIds;
};
