import {OrderedMap} from 'immutable';

import {IContentProfileV2} from 'superdesk-api';
import {getPlanningProfileFields, IFieldConverted} from './profile-fields';
import {getFieldDefinitions} from './field-definitions/index';

export function getProfile(profileType: 'event' | 'planning', language: string) {
    const convertedFields = getPlanningProfileFields({embeddedOnly: true, profile: profileType});
    const skipped = new Set<string>();
    const fieldDefinitions = getFieldDefinitions(profileType);
    const profileV2: IContentProfileV2 = {
        id: 'not-used',
        name: 'not-used',
        content: OrderedMap([]),
        header: OrderedMap(),
    };

    for (const {fieldId, required} of convertedFields) {
        const currentField: IFieldConverted = convertedFields.find(({fieldId: id}) => fieldId === id);

        if (fieldDefinitions[fieldId] != null && currentField.type === 'editor3') {
            profileV2.header = profileV2.header.set(
                fieldId,
                fieldDefinitions[fieldId].getField({
                    type: 'editor3',
                    id: fieldId,
                    required: required,
                    language: language,
                    formattingOptions: currentField.format_options,
                    maxLength: currentField.maxlength,
                    minLength: currentField.minlength,
                }),
            );
        } else if (fieldDefinitions[fieldId] != null) {
            profileV2.header = profileV2.header.set(
                fieldId,
                fieldDefinitions[fieldId].getField({
                    type: 'base',
                    id: fieldId,
                    required: required,
                    language: language,
                }),
            );
        } else {
            skipped.add(fieldId);
        }
    }

    profileV2.header.forEach((item) => {
        item.fieldConfig.width = 100;
    });

    return profileV2;
}
