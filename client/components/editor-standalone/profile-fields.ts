import {isSystemRequiredField} from '../../api/utils/constants';
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

/**
 * Fields that might exist in the planning profile (database)
 * but aren't mapped to work in a standalone editor.
 */
const unimplementedFields = new Set<string>([
    'associated_event',
]);

/**
 * A function that handles planning profile field types so they can be used in authoring react.
 * @embeddedOnly defaults to false
 */
export const getPlanningProfileFields = (
    options: {
        profile: 'planning' | 'event',
        embeddedOnly?: boolean
    },
): Array<IFieldConverted> => {
    const planningProfile = planningApi.contentProfiles.get(options.profile);
    const planningGroups = getEditorFormGroupsFromProfile(planningProfile);
    const planningFieldIds = Object.values(planningGroups)
        .flatMap((x) => x.fields)
        .filter((x) => !unimplementedFields.has(x));
    const convertedFieldIds: Array<IFieldConverted> = [];

    for (const fieldId of planningFieldIds) {
        const fieldSchema = planningProfile.schema[fieldId];
        const shouldBeShown = fieldSchema.show_in_embedded_editor || fieldSchema.required;

        /**
         * If a field does not have show_in_embedded_editor or required toggled on,
         * or is not a system required field we must not show it in the embedded editor
         */
        if (
            !isSystemRequiredField(fieldId)
            && options.embeddedOnly
            && shouldBeShown != true
        ) {
            continue;
        }

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
