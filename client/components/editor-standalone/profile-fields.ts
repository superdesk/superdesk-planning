import {assertNever} from 'superdesk-core/scripts/core/helpers/typescript-helpers';
import {EVENT_ITEM_SYSTEM_REQUIRED_FIELDS, PLANNING_ITEM_SYSTEM_REQUIRED_FIELDS} from '../../api/utils/constants';
import {planningApi} from '../../superdeskApi';
import {getEditorFormGroupsFromProfile} from '../../utils/contentProfiles';
import {IProfileSchemaTypeString} from 'interfaces';
import {RICH_FORMATTING_OPTION} from 'superdesk-api';

interface IBaseField<T> {
    type: T;
    fieldId: string;
    required: boolean;
}

interface ICustomVocabularyField extends IBaseField<'custom_vocabulary'> {
    vocabularyId: string;
}

export interface IEditor3Field extends IBaseField<'editor3'> {
    format_options?: Array<RICH_FORMATTING_OPTION>;
    maxlength?: number;
    minlength?: number;
}

export type IFieldConverted = IBaseField<'normal'> | ICustomVocabularyField | IEditor3Field;

/**
 * Fields that might exist in the planning profile (database)
 * but aren't mapped to work in a standalone editor.
 */
const unimplementedFields = new Set<string>([
    'associated_event',
]);

export const TEXT_FIELDS_MULTIPLE_TYPES = new Set<string>([
    'name',
    'internal_note',
    'ednote',
    'description_short',
    'description_text',
    'invitation_details',
    'accreditation_info',
    'registration_details',
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
    const convertedFields: Array<IFieldConverted> = [];
    const isFieldSystemRequired = (fieldId: string) => {
        if (options.profile === 'event') {
            return EVENT_ITEM_SYSTEM_REQUIRED_FIELDS.includes(fieldId);
        } else if (options.profile === 'planning') {
            return PLANNING_ITEM_SYSTEM_REQUIRED_FIELDS.includes(fieldId);
        } else {
            return assertNever(options.profile);
        }
    };

    for (const fieldId of planningFieldIds) {
        const fieldSchema = planningProfile.schema[fieldId];
        const shouldBeShown = fieldSchema.show_in_embedded_editor || fieldSchema.required;

        /**
         * If a field does not have show_in_embedded_editor or required toggled on,
         * or is not a system required field we must not show it in the embedded editor
         */
        if (
            !isFieldSystemRequired(fieldId)
            && options.embeddedOnly
            && shouldBeShown != true
        ) {
            continue;
        }

        if (fieldSchema?.type === 'list' && ((fieldSchema.vocabularies ?? []).length > 0)) {
            for (const vocabId of fieldSchema.vocabularies) {
                convertedFields.push({
                    type: 'custom_vocabulary',
                    fieldId: vocabId,
                    required: fieldSchema.required ?? false,
                    vocabularyId: vocabId,
                });
            }
        } else if (
            TEXT_FIELDS_MULTIPLE_TYPES.has(fieldId)
            && (fieldSchema as IProfileSchemaTypeString).field_type === 'editor_3'
        ) {
            const castedSchema = fieldSchema as IProfileSchemaTypeString;

            convertedFields.push({
                type: 'editor3',
                fieldId: fieldId,
                required: fieldSchema.required ?? false,
                format_options: castedSchema.format_options,
                maxlength: castedSchema.maxlength,
                minlength: castedSchema.minlength,
            });
        } else {
            convertedFields.push({
                type: 'normal',
                fieldId: fieldId,
                required: fieldSchema.required ?? false,
            });
        }
    }

    return convertedFields;
};
